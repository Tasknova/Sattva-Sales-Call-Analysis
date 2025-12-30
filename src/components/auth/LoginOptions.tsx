import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Building, Users, User, ArrowRight, ArrowLeft, Shield, Target, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

interface LoginOptionsProps {
  onAdminLogin: () => void;
  onManagerLogin: () => void;
  onEmployeeLogin: () => void;
  onBack?: () => void;
}

export default function LoginOptions({ onAdminLogin, onManagerLogin, onEmployeeLogin, onBack }: LoginOptionsProps) {
  const { toast } = useToast();

  const loginOptions = [
    {
      id: 'admin',
      title: 'Admin Login',
      description: 'Company admin with access to manage users and leads',
      icon: Building,
      color: 'blue',
      action: onAdminLogin,
      actionText: 'Admin Login'
    },
    {
      id: 'manager',
      title: 'Manager Login',
      description: 'Team leader who manages employees and assigns leads',
      icon: Users,
      color: 'green',
      action: onManagerLogin,
      actionText: 'Manager Login'
    },
    {
      id: 'employee',
      title: 'Employee Login',
      description: 'Team member handles leads and makes calls',
      icon: User,
      color: 'purple',
      action: onEmployeeLogin,
      actionText: 'Employee Login'
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
      case 'purple':
        return {
          bg: 'bg-purple-50',
          iconBg: 'bg-purple-100',
          iconColor: 'text-purple-500',
          button: 'bg-purple-500 hover:bg-purple-600',
          border: 'border-purple-200'
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
      <div className="max-w-4xl w-full">
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
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose your role to access the appropriate dashboard and features
          </p>
        </motion.div>

        {/* Login Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {loginOptions.map((option, index) => {
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
                  <CardContent className="pt-0">
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
