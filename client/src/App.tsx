import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { SubscribeEmailInput, ContactInput, LandingPageStats } from '../../server/src/schema';
import { ContactForm } from '@/components/ContactForm';

function App() {
  const [stats, setStats] = useState<LandingPageStats | null>(null);
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeMessage, setSubscribeMessage] = useState('');
  const [showContactForm, setShowContactForm] = useState(false);

  // Track page visit on mount
  useEffect(() => {
    const trackPageVisit = async () => {
      try {
        await trpc.trackVisit.mutate();
      } catch (error) {
        console.error('Failed to track visit:', error);
      }
    };
    trackPageVisit();
  }, []);

  // Load landing page statistics
  const loadStats = useCallback(async () => {
    try {
      const result = await trpc.getLandingStats.query();
      setStats(result);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubscribing(true);
    setSubscribeMessage('');

    try {
      await trpc.subscribeEmail.mutate({ email: email.trim() } as SubscribeEmailInput);
      setSubscribeMessage('🎉 Thank you! We\'ll notify you when we launch.');
      setEmail('');
      // Refresh stats to show updated subscription count
      await loadStats();
    } catch (error) {
      console.error('Subscription failed:', error);
      setSubscribeMessage('❌ Something went wrong. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleContactSubmit = async (data: ContactInput) => {
    try {
      await trpc.submitContact.mutate(data);
      setShowContactForm(false);
      setSubscribeMessage('📨 Thank you for your message! We\'ll get back to you soon.');
    } catch (error) {
      console.error('Contact submission failed:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-black text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo/Brand */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-black">💼</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                JobBoard
              </h1>
            </div>
            <Badge variant="outline" className="border-orange-500 text-orange-400 mb-8">
              Coming Soon
            </Badge>
          </div>

          {/* Main Headline */}
          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            The Future of Job Search
            <span className="block text-2xl md:text-4xl text-gray-300 mt-2">
              is Almost Here 🚀
            </span>
          </h2>

          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            We're building the most innovative job board platform that connects talented professionals 
            with their dream opportunities. Get ready for a revolutionary job search experience.
          </p>

          {/* Email Subscription */}
          <Card className="bg-gray-800/50 border-gray-700 max-w-md mx-auto mb-8 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-orange-400">Be the First to Know</CardTitle>
              <CardDescription className="text-gray-400">
                Join our newsletter for exclusive early access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubscribe} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  className="bg-gray-900 border-gray-600 text-white placeholder:text-gray-400 focus:border-orange-500"
                  required
                />
                <Button 
                  type="submit" 
                  disabled={isSubscribing}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-semibold"
                >
                  {isSubscribing ? '⏳ Subscribing...' : '🔔 Notify Me'}
                </Button>
              </form>
              {subscribeMessage && (
                <p className="mt-3 text-sm text-center text-gray-300">
                  {subscribeMessage}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          {stats && (
            <div className="flex justify-center gap-8 mb-12">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">{stats.total_visits.toLocaleString()}</div>
                <div className="text-sm text-gray-400">Visitors</div>
              </div>
              <Separator orientation="vertical" className="h-12 bg-gray-600" />
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">{stats.total_subscriptions.toLocaleString()}</div>
                <div className="text-sm text-gray-400">Subscribers</div>
              </div>
            </div>
          )}
        </div>

        {/* Features Preview */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          <Card className="bg-gray-800/30 border-gray-700 backdrop-blur-sm hover:bg-gray-800/50 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-orange-400">Smart Matching</h3>
              <p className="text-gray-400">AI-powered job recommendations tailored to your skills and preferences.</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/30 border-gray-700 backdrop-blur-sm hover:bg-gray-800/50 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-orange-400">Lightning Fast</h3>
              <p className="text-gray-400">Apply to multiple jobs with one click using our streamlined process.</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/30 border-gray-700 backdrop-blur-sm hover:bg-gray-800/50 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌟</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-orange-400">Premium Experience</h3>
              <p className="text-gray-400">Beautiful interface with advanced filtering and company insights.</p>
            </CardContent>
          </Card>
        </div>

        {/* Contact Section */}
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4 text-orange-400">Have Questions or Feedback?</h3>
          <p className="text-gray-300 mb-6">
            We'd love to hear from early users and potential partners.
          </p>
          <Button
            onClick={() => setShowContactForm(true)}
            variant="outline"
            className="border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-black"
          >
            💬 Get in Touch
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 bg-gray-900/50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400">
            <p className="mb-2">© 2024 JobBoard. All rights reserved.</p>
            <p className="text-sm">
              Building the future of job search, one opportunity at a time.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <ContactForm
          onSubmit={handleContactSubmit}
          onClose={() => setShowContactForm(false)}
        />
      )}
    </div>
  );
}

export default App;