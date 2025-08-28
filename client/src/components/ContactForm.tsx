import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import type { ContactInput } from '../../../server/src/schema';

interface ContactFormProps {
  onSubmit: (data: ContactInput) => Promise<void>;
  onClose: () => void;
}

export function ContactForm({ onSubmit, onClose }: ContactFormProps) {
  const [formData, setFormData] = useState<ContactInput>({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<ContactInput>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactInput> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Failed to submit contact form:', error);
      setErrors({ message: 'Failed to send message. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ContactInput, value: string) => {
    setFormData((prev: ContactInput) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="bg-gray-800 border-gray-700 max-w-md w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-orange-400">Contact Us</CardTitle>
              <CardDescription className="text-gray-400">
                Send us a message and we'll get back to you soon!
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white h-8 w-8 p-0"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                placeholder="Your name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  handleInputChange('name', e.target.value)
                }
                className="bg-gray-900 border-gray-600 text-white placeholder:text-gray-400 focus:border-orange-500"
                required
              />
              {errors.name && (
                <p className="text-red-400 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Input
                type="email"
                placeholder="Your email address"
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  handleInputChange('email', e.target.value)
                }
                className="bg-gray-900 border-gray-600 text-white placeholder:text-gray-400 focus:border-orange-500"
                required
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <Textarea
                placeholder="Your message (minimum 10 characters)"
                value={formData.message}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                  handleInputChange('message', e.target.value)
                }
                className="bg-gray-900 border-gray-600 text-white placeholder:text-gray-400 focus:border-orange-500 min-h-[100px]"
                required
              />
              {errors.message && (
                <p className="text-red-400 text-sm mt-1">{errors.message}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-semibold"
              >
                {isSubmitting ? '📤 Sending...' : '📨 Send Message'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}