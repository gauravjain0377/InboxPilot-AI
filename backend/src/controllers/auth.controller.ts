import { Request, Response, NextFunction } from 'express';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User } from '../models/User.js';
import { encrypt } from '../utils/encrypt.js';
import { AppError } from '../utils/errorHandler.js';
import { logger } from '../utils/logger.js';
import { AuthRequest } from '../middlewares/auth.js';

export const googleAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code } = req.body;

    if (!code) {
      throw new AppError('Authorization code required', 400);
    }

    const oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    if (!userInfo.data.email || !userInfo.data.id) {
      throw new AppError('Failed to get user info', 400);
    }

    let user = await User.findOne({ email: userInfo.data.email });

    if (user) {
      user.accessToken = encrypt(tokens.access_token || '');
      user.refreshToken = encrypt(tokens.refresh_token || '');
      user.tokenExpiry = tokens.expiry_date ? new Date(tokens.expiry_date) : undefined;
      await user.save();
    } else {
      user = await User.create({
        email: userInfo.data.email,
        name: userInfo.data.name || '',
        picture: userInfo.data.picture,
        googleId: userInfo.data.id,
        accessToken: encrypt(tokens.access_token || ''),
        refreshToken: encrypt(tokens.refresh_token || ''),
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      config.security.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });
  } catch (error) {
    logger.error('Google auth error:', error);
    next(error);
  }
};

export const getAuthUrl = (req: Request, res: Response): void => {
  const oauth2Client = new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
  });

  res.json({ success: true, url });
};

export const handleCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code, error: oauthError } = req.query;

    // Check if Google returned an error
    if (oauthError) {
      logger.error('OAuth error from Google:', oauthError);
      return res.redirect(`${config.server.frontendUrl}/login?error=oauth_error`);
    }

    if (!code || typeof code !== 'string') {
      logger.error('No authorization code received');
      return res.redirect(`${config.server.frontendUrl}/login?error=no_code`);
    }

    // Validate configuration
    if (!config.google.clientId || !config.google.clientSecret || !config.google.redirectUri) {
      logger.error('OAuth configuration missing');
      return res.redirect(`${config.server.frontendUrl}/login?error=config_error`);
    }

    const oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );

    let tokens;
    try {
      const tokenResponse = await oauth2Client.getToken(code);
      tokens = tokenResponse.tokens;
    } catch (tokenError: any) {
      logger.error('Error getting tokens:', tokenError);
      return res.redirect(`${config.server.frontendUrl}/login?error=token_error`);
    }

    oauth2Client.setCredentials(tokens);

    let userInfo;
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      userInfo = await oauth2.userinfo.get();
    } catch (userInfoError) {
      logger.error('Error getting user info:', userInfoError);
      return res.redirect(`${config.server.frontendUrl}/login?error=userinfo_error`);
    }

    if (!userInfo.data.email || !userInfo.data.id) {
      logger.error('Missing user email or ID');
      return res.redirect(`${config.server.frontendUrl}/login?error=auth_failed`);
    }

    let user;
    try {
      user = await User.findOne({ email: userInfo.data.email });

      if (user) {
        user.accessToken = encrypt(tokens.access_token || '');
        user.refreshToken = encrypt(tokens.refresh_token || '');
        user.tokenExpiry = tokens.expiry_date ? new Date(tokens.expiry_date) : undefined;
        await user.save();
      } else {
        user = await User.create({
          email: userInfo.data.email,
          name: userInfo.data.name || '',
          picture: userInfo.data.picture,
          googleId: userInfo.data.id,
          accessToken: encrypt(tokens.access_token || ''),
          refreshToken: encrypt(tokens.refresh_token || ''),
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        });
      }
    } catch (dbError) {
      logger.error('Database error during user creation/update:', dbError);
      return res.redirect(`${config.server.frontendUrl}/login?error=db_error`);
    }

    if (!config.security.jwtSecret) {
      logger.error('JWT secret not configured');
      return res.redirect(`${config.server.frontendUrl}/login?error=config_error`);
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      config.security.jwtSecret,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    const frontendUrl = config.server.frontendUrl;
    res.redirect(`${frontendUrl}/auth/callback?token=${token}&email=${encodeURIComponent(user.email)}`);
  } catch (error) {
    logger.error('OAuth callback error:', error);
    const frontendUrl = config.server.frontendUrl;
    res.redirect(`${frontendUrl}/login?error=callback_failed`);
  }
};

// Return basic user info
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });
  } catch (error) {
    next(error);
  }
};

