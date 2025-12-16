import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Building, Users, User, ArrowRight, Shield, Target, Phone, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface RoleSelectionProps {
  onSignup: () => void;
  onLogin: () => void;
  onBack?: () => void;
}

export default function RoleSelection({ onSignup, onLogin, onBack }: RoleSelectionProps) {
  const { toast } = useToast();

  const options = [
    {
      id: 'signup',
      title: 'Sign Up',
      description: 'Create your company account and get started with Sattva',
      icon: Building,
      color: 'blue',
      features: ['Create your company', 'Add managers & employees', 'Full admin access', '14-day free trial'],
      action: onSignup,
      actionText: 'Create Company Account'
    },
    {
      id: 'login',
      title: 'Login',
      description: 'Sign in to your existing account',
      icon: User,
      color: 'green',
      features: ['Access your dashboard', 'Continue where you left off', 'Secure authentication', 'Role-based access'],
      action: onLogin,
      actionText: 'Sign In'
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-50',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-500',
          button: 'bg-blue-500 hover:bg-blue-600',
          border: 'border-blue-200'
        };
      case 'green':
        return {
          bg: 'bg-green-50',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-500',
          button: 'bg-green-500 hover:bg-green-600',
          border: 'border-green-200'
        };
      default:
        return {
          bg: 'bg-gray-50',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-500',
          button: 'bg-gray-500 hover:bg-gray-600',
          border: 'border-gray-200'
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-6 py-12">
      {/* Back Button */}
      {onBack && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute top-6 left-6 z-10"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="bg-white/80 backdrop-blur-sm hover:bg-white/90 border-gray-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </motion.div>
      )}
      
      <div className="max-w-6xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-6">
              <img 
                src="/Sattva_logo.png" 
                alt="Sattva" 
                className="h-12 w-auto"
                onError={(e) => { e.currentTarget.src = "/Sattva_logo.png"; }}
              />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Sattva Voice Analysis
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get started with AI-powered call analysis for your business
          </p>
        </motion.div>

        {/* Option Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {options.map((option, index) => {
            const colors = getColorClasses(option.color);
            const IconComponent = option.icon;
            
            return (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="h-full"
              >
                <Card className={`h-full shadow-lg hover:shadow-xl transition-all duration-300 border-2 ${colors.border} hover:scale-105`}>
                  <CardHeader className="text-center pb-4">
                    <div className={`w-20 h-20 ${colors.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <IconComponent className={`h-10 w-10 ${colors.iconColor}`} />
                    </div>
                    <CardTitle className="text-2xl text-gray-900">{option.title}</CardTitle>
                    <CardDescription className="text-base text-gray-600">
                      {option.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Features */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                        Key Features
                      </h4>
                      <ul className="space-y-2">
                        {option.features.map((feature, featureIndex) => (
                          <motion.li
                            key={featureIndex}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: (index * 0.1) + (featureIndex * 0.05) }}
                            className="flex items-center text-sm text-gray-600"
                          >
                            <div className={`w-2 h-2 ${colors.iconBg} rounded-full mr-3`} />
                            {feature}
                          </motion.li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={option.action}
                      className={`w-full h-12 text-base ${colors.button} text-white`}
                    >
                      {option.actionText}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-center mt-12"
        >
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Secure Authentication
              </div>
              <div className="flex items-center">
                <Target className="h-4 w-4 mr-2" />
                Role-Based Access
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                Call Analytics
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
