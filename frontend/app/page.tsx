'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Mail, Sparkles, Clock, TrendingUp, Zap, Shield, ArrowRight, Check, Star, Inbox, Reply, Brain, Play } from 'lucide-react';
import { ContactModal } from '@/components/ui/contact-modal';

// Typewriter Effect Component
const TypewriterText = ({ texts, className }: { texts: string[], className?: string }) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const text = texts[currentTextIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (currentText.length < text.length) {
          setCurrentText(text.slice(0, currentText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (currentText.length > 0) {
          setCurrentText(currentText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentTextIndex((prev) => (prev + 1) % texts.length);
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentTextIndex, texts]);

  return (
    <span className={className}>
      {currentText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="inline-block w-[3px] h-[1em] bg-blue-500 ml-1 align-middle"
      />
    </span>
  );
};

// Feature Card
const FeatureCard = ({ icon: Icon, title, description, delay }: any) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="group relative"
    >
      <div className="relative bg-white border border-neutral-200 rounded-2xl p-8 h-full hover:border-neutral-300 hover:shadow-lg transition-all duration-300">
        {/* Icon */}
        <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Content */}
        <h3 className="text-xl font-semibold text-neutral-900 mb-3 font-display">
          {title}
        </h3>
        <p className="text-neutral-600 leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
};

// Stats Counter
const AnimatedCounter = ({ value, suffix = '' }: { value: number, suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

// Main Landing Page
export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const [showContactModal, setShowContactModal] = useState(false);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Intelligence",
      description: "Advanced AI analyzes your emails, understanding context and sentiment with remarkable precision.",
    },
    {
      icon: Reply,
      title: "Smart Reply Generation",
      description: "Generate perfectly crafted responses in seconds. Choose formal, friendly, or assertive tones.",
    },
    {
      icon: TrendingUp,
      title: "Priority Intelligence",
      description: "Never miss what matters. AI surfaces urgent emails and filters out the noise automatically.",
    },
    {
      icon: Clock,
      title: "Follow-up Automation",
      description: "Smart reminders ensure no conversation falls through the cracks. Stay on top of every thread.",
    },
    {
      icon: Zap,
      title: "Instant Summaries",
      description: "Long email threads condensed into actionable insights. Get the essence in seconds.",
    },
    {
      icon: Shield,
      title: "Bank-Grade Security",
      description: "End-to-end encryption and OAuth 2.0. Your privacy and data security is non-negotiable.",
    },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-white text-neutral-900 overflow-hidden font-sans">
      
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white" />
        <div className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-100"
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-neutral-900 font-display tracking-tight">
              InboxPilot AI
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {['Features', 'How it Works', 'Pricing'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(' ', '-')}`}
                className="text-neutral-600 hover:text-neutral-900 transition-colors text-sm font-medium"
              >
                {item}
              </a>
            ))}
            <Link
              href="/privacy"
              className="text-neutral-600 hover:text-neutral-900 transition-colors text-sm font-medium"
            >
              Privacy
            </Link>
          </nav>

          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-5 py-2.5 bg-neutral-900 text-white rounded-xl font-medium text-sm hover:bg-neutral-800 transition-colors"
            >
              Get Started
            </motion.button>
          </Link>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-24 pb-20 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 rounded-full mb-8"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 bg-blue-500 rounded-full"
              />
              <span className="text-sm text-white font-medium">Trusted by 10,000+ professionals</span>
            </motion.div>

            {/* Heading */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-7xl font-bold mb-6 leading-[1.1] tracking-tight font-display"
            >
              <span className="text-neutral-900">Your Inbox,</span>
              <br />
              <span className="text-blue-600">
                <TypewriterText
                  texts={['Supercharged', 'Automated', 'Intelligent', 'Simplified']}
                />
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-neutral-600 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Experience the future of email. AI that reads, understands, and responds 
              to your emails with precision and personality.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group px-8 py-4 bg-neutral-900 text-white rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 hover:bg-neutral-800 transition-colors"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 bg-neutral-100 text-neutral-900 rounded-2xl font-semibold text-lg hover:bg-neutral-200 transition-colors flex items-center justify-center gap-3"
              >
                <Play className="w-5 h-5" />
                Watch Demo
              </motion.button>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8"
            >
              <div className="flex -space-x-3">
                {['#3B82F6', '#1D4ED8', '#2563EB', '#60A5FA', '#93C5FD'].map((color, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: color }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-neutral-600">
                  Loved by <span className="font-semibold text-neutral-900">10,000+</span> professionals
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ opacity }}
        >
          <div className="w-6 h-10 border-2 border-neutral-300 rounded-full flex justify-center p-2">
            <motion.div
              className="w-1.5 h-1.5 bg-neutral-400 rounded-full"
              animate={{ y: [0, 16, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 px-4 bg-neutral-50">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { value: 10000, suffix: '+', label: 'Active Users' },
              { value: 5, suffix: 'M+', label: 'Emails Processed' },
              { value: 98, suffix: '%', label: 'Accuracy Rate' },
              { value: 4, suffix: 'hrs', label: 'Saved Weekly' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-4xl md:text-5xl font-bold text-neutral-900 mb-2 font-display">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-neutral-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 px-4">
        <div className="container mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-neutral-700" />
              <span className="text-sm text-neutral-700 font-medium">Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 font-display tracking-tight">
              Everything you need to
              <br />
              <span className="text-blue-600">conquer your inbox</span>
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Powerful AI meets intuitive design to transform how you handle email.
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} delay={index * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-24 px-4 bg-neutral-900 text-white">
        <div className="container mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 font-display tracking-tight">
              Get started in <span className="text-blue-400">60 seconds</span>
            </h2>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
              Three simple steps to transform your email workflow forever.
            </p>
          </motion.div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { icon: Mail, title: 'Connect Gmail', description: 'One-click OAuth. No passwords stored, ever.', step: '01' },
              { icon: Brain, title: 'AI Learns You', description: 'Our AI studies your communication style.', step: '02' },
              { icon: Zap, title: 'Experience Magic', description: 'Watch AI handle your inbox effortlessly.', step: '03' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                viewport={{ once: true }}
                className="relative text-center"
              >
                <div className="text-7xl font-bold text-neutral-800 mb-4 font-display">{item.step}</div>
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <item.icon className="w-8 h-8 text-neutral-900" />
                </div>
                <h3 className="text-2xl font-bold mb-3 font-display">{item.title}</h3>
                <p className="text-neutral-400">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-24 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 font-display tracking-tight">
              Loved by <span className="text-blue-600">professionals</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "InboxPilot AI has transformed how I handle my 200+ daily emails. The AI summaries alone save me 2 hours every day.",
                author: "Sarah Chen",
                role: "VP of Operations",
                company: "TechCorp"
              },
              {
                quote: "The smart reply feature is uncanny. It captures my communication style perfectly. My team thinks I've become a writing genius.",
                author: "Michael Torres",
                role: "CEO",
                company: "StartupXYZ"
              },
              {
                quote: "Finally, an AI tool that actually delivers on its promises. Zero inbox is no longer a dream, it's my reality.",
                author: "Emily Watson",
                role: "Managing Director",
                company: "Global Finance"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-neutral-50 border border-neutral-200 rounded-2xl p-8"
              >
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-neutral-700 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center font-bold text-white">
                    {testimonial.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">{testimonial.author}</p>
                    <p className="text-sm text-neutral-500">{testimonial.role}, {testimonial.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-neutral-900 rounded-3xl p-12 md:p-20 text-center text-white"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 font-display tracking-tight">
              Ready to transform your
              <br />
              <span className="text-blue-400">email experience?</span>
            </h2>
            <p className="text-xl text-neutral-400 mb-10 max-w-2xl mx-auto">
              Join thousands of professionals who've already discovered the future of email.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group px-10 py-5 bg-white text-neutral-900 rounded-2xl font-bold text-xl flex items-center gap-3 hover:bg-neutral-100 transition-colors"
                >
                  Get Started Free
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>

              <div className="flex items-center gap-2 text-neutral-400">
                <Check className="w-5 h-5 text-blue-400" />
                <span>No credit card required</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4 border-t border-neutral-200">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-neutral-900 font-display">InboxPilot AI</span>
            </div>
            <p className="text-neutral-500">
              &copy; 2026 InboxPilot AI. Crafted with care.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-neutral-500 hover:text-neutral-900 transition-colors text-sm">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-neutral-500 hover:text-neutral-900 transition-colors text-sm">
                Terms of Service
              </Link>
              <button 
                onClick={() => setShowContactModal(true)}
                className="text-neutral-500 hover:text-neutral-900 transition-colors text-sm"
              >
                Contact
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      <ContactModal 
        isOpen={showContactModal} 
        onClose={() => setShowContactModal(false)} 
      />
    </div>
  );
}
