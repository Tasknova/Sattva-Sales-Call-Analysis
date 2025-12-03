import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Phone, BarChart3, Users, Zap, Shield, ArrowRight, UserCog, Layers } from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onSignup: () => void;
}

export default function LandingPage({ onGetStarted, onLogin, onSignup }: LandingPageProps) {

  const features = [
    {
      icon: Users,
      title: "Lead Management",
      description: "Organize and manage your leads efficiently with groups, assignments, and tracking"
    },
    {
      icon: Phone,
      title: "Integrated Calling",
      description: "Make calls directly from the platform with automatic recording and analysis"
    },
    {
      icon: BarChart3,
      title: "AI-Powered Analysis",
      description: "Advanced sentiment, engagement, and objection analysis powered by AI"
    },
    {
      icon: Layers,
      title: "3-Tier Hierarchy",
      description: "Admin, Manager, and Employee roles with customized dashboards and permissions"
    },
    {
      icon: Zap,
      title: "End-to-End Automation",
      description: "Complete workflow from lead assignment to call analysis and reporting"
    },
    {
      icon: Shield,
      title: "Comprehensive Reports",
      description: "Detailed performance reports, analytics, and insights at every level"
    }
  ];

  const benefits = [
    "Complete lead-to-analysis workflow automation",
    "Hierarchical team management (Admin, Manager, Employee)",
    "Integrated calling with automatic recording",
    "Real-time AI-powered call analysis and insights",
    "Comprehensive performance tracking and reports",
    "Role-based dashboards and permissions"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo */}
            <div className="flex items-center">
              <img 
                src="/logo2.png" 
                alt="Tasknova" 
                className="h-10 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                onError={(e) => {
                  e.currentTarget.src = "/logo.png";
                }}
                onClick={() => window.location.href = '/'}
              />
            </div>
            
            {/* Right side - Auth buttons */}
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={onLogin}
                className="text-gray-700 hover:text-accent-blue"
              >
                Log In
              </Button>
              <Button 
                onClick={onSignup}
                className="bg-accent-blue text-white hover:bg-accent-blue/90"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-6 py-20 text-gray-900">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center mb-6">
                <Badge className="bg-accent-blue/10 text-accent-blue border-accent-blue/20 text-sm px-4 py-1">
                  🚀 The Future of Sales Management
                </Badge>
              </div>
              <h1 className="text-5xl font-bold leading-tight mb-6">
                <span className="text-accent-blue">Tasknova</span>
                <br />
                Your Complete Sales 
                <br />
                <span className="bg-gradient-to-r from-accent-blue to-purple-600 bg-clip-text text-transparent">
                  Command Center
                </span>
              </h1>
              <p className="text-xl text-gray-700 mb-6 leading-relaxed">
                Manage leads, make intelligent calls, and get AI-powered insights—all in one powerful platform. 
                Built for modern teams with <span className="font-semibold text-accent-blue">Admin, Manager & Employee</span> roles.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full shadow-sm">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="text-sm font-medium">Lead Management</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full shadow-sm">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="text-sm font-medium">Integrated Calling</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full shadow-sm">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="text-sm font-medium">AI Analysis</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-start">
                <Button 
                  size="xl" 
                  variant="accent" 
                  onClick={onGetStarted}
                  className="bg-accent-blue text-white hover:bg-accent-blue/90 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  Start Free Trial
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button 
                  size="xl" 
                  variant="outline" 
                  onClick={onLogin}
                  className="border-2 border-accent-blue text-accent-blue hover:bg-accent-blue/5"
                >
                  Watch Demo
                  <Zap className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                ✨ No credit card required • 14-day free trial • Setup in 5 minutes
              </p>
            </div>
            
            <div className="relative">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-3 rounded-full bg-success"></div>
                    <div className="text-sm text-gray-600">Growth Analytics</div>
                  </div>
                  
                  {/* Frequency Graph */}
                  <div className="relative h-32 w-full">
                    <svg className="w-full h-full" viewBox="0 0 300 120" preserveAspectRatio="none">
                      <defs>
                        {/* Bar gradients */}
                        <linearGradient id="barGradient1" x1="0%" y1="100%" x2="0%" y2="0%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#60a5fa" />
                        </linearGradient>
                        <linearGradient id="barGradient2" x1="0%" y1="100%" x2="0%" y2="0%">
                          <stop offset="0%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#67e8f9" />
                        </linearGradient>
                        <linearGradient id="barGradient3" x1="0%" y1="100%" x2="0%" y2="0%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#34d399" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid lines */}
                      <g stroke="#e5e7eb" strokeWidth="0.5" opacity="0.5">
                        <line x1="0" y1="100" x2="300" y2="100" />
                        <line x1="0" y1="80" x2="300" y2="80" />
                        <line x1="0" y1="60" x2="300" y2="60" />
                        <line x1="0" y1="40" x2="300" y2="40" />
                        <line x1="0" y1="20" x2="300" y2="20" />
                      </g>
                      
                      {/* Frequency bars */}
                      <g>
                        {/* Bar 1 */}
                        <rect x="20" y="70" width="15" height="30" fill="url(#barGradient1)" rx="2" className="drop-shadow-sm">
                          <animate attributeName="height" values="30;35;30" dur="2s" repeatCount="indefinite"/>
                          <animate attributeName="y" values="70;65;70" dur="2s" repeatCount="indefinite"/>
                        </rect>
                        
                        {/* Bar 2 */}
                        <rect x="45" y="50" width="15" height="50" fill="url(#barGradient2)" rx="2" className="drop-shadow-sm">
                          <animate attributeName="height" values="50;55;50" dur="2s" begin="0.2s" repeatCount="indefinite"/>
                          <animate attributeName="y" values="50;45;50" dur="2s" begin="0.2s" repeatCount="indefinite"/>
                        </rect>
                        
                        {/* Bar 3 */}
                        <rect x="70" y="40" width="15" height="60" fill="url(#barGradient3)" rx="2" className="drop-shadow-sm">
                          <animate attributeName="height" values="60;65;60" dur="2s" begin="0.4s" repeatCount="indefinite"/>
                          <animate attributeName="y" values="40;35;40" dur="2s" begin="0.4s" repeatCount="indefinite"/>
                        </rect>
                        
                        {/* Bar 4 */}
                        <rect x="95" y="60" width="15" height="40" fill="url(#barGradient1)" rx="2" className="drop-shadow-sm">
                          <animate attributeName="height" values="40;45;40" dur="2s" begin="0.6s" repeatCount="indefinite"/>
                          <animate attributeName="y" values="60;55;60" dur="2s" begin="0.6s" repeatCount="indefinite"/>
                        </rect>
                        
                        {/* Bar 5 */}
                        <rect x="120" y="30" width="15" height="70" fill="url(#barGradient3)" rx="2" className="drop-shadow-sm">
                          <animate attributeName="height" values="70;75;70" dur="2s" begin="0.8s" repeatCount="indefinite"/>
                          <animate attributeName="y" values="30;25;30" dur="2s" begin="0.8s" repeatCount="indefinite"/>
                        </rect>
                        
                        {/* Bar 6 */}
                        <rect x="145" y="55" width="15" height="45" fill="url(#barGradient2)" rx="2" className="drop-shadow-sm">
                          <animate attributeName="height" values="45;50;45" dur="2s" begin="1s" repeatCount="indefinite"/>
                          <animate attributeName="y" values="55;50;55" dur="2s" begin="1s" repeatCount="indefinite"/>
                        </rect>
                        
                        {/* Bar 7 */}
                        <rect x="170" y="25" width="15" height="75" fill="url(#barGradient3)" rx="2" className="drop-shadow-sm">
                          <animate attributeName="height" values="75;80;75" dur="2s" begin="1.2s" repeatCount="indefinite"/>
                          <animate attributeName="y" values="25;20;25" dur="2s" begin="1.2s" repeatCount="indefinite"/>
                        </rect>
                        
                        {/* Bar 8 */}
                        <rect x="195" y="45" width="15" height="55" fill="url(#barGradient1)" rx="2" className="drop-shadow-sm">
                          <animate attributeName="height" values="55;60;55" dur="2s" begin="1.4s" repeatCount="indefinite"/>
                          <animate attributeName="y" values="45;40;45" dur="2s" begin="1.4s" repeatCount="indefinite"/>
                        </rect>
                        
                        {/* Bar 9 */}
                        <rect x="220" y="35" width="15" height="65" fill="url(#barGradient2)" rx="2" className="drop-shadow-sm">
                          <animate attributeName="height" values="65;70;65" dur="2s" begin="1.6s" repeatCount="indefinite"/>
                          <animate attributeName="y" values="35;30;35" dur="2s" begin="1.6s" repeatCount="indefinite"/>
                        </rect>
                        
                        {/* Bar 10 */}
                        <rect x="245" y="20" width="15" height="80" fill="url(#barGradient3)" rx="2" className="drop-shadow-sm">
                          <animate attributeName="height" values="80;85;80" dur="2s" begin="1.8s" repeatCount="indefinite"/>
                          <animate attributeName="y" values="20;15;20" dur="2s" begin="1.8s" repeatCount="indefinite"/>
                        </rect>
                      </g>
                    </svg>
                    
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-700 font-medium">
                    <span>Performance Growth</span>
                    <span className="text-success">↗ Trending Up</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Tier System Section */}
      <section className="px-6 py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <Badge className="bg-purple-100 text-purple-700 border-purple-200 mb-4">
              ⚡ Hierarchical Power
            </Badge>
            <h2 className="text-4xl font-bold mb-4">
              Built for Your <span className="text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">Entire Organization</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Seamless collaboration with role-based permissions and customized dashboards for every team member
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-2 border-blue-200 bg-blue-50/50 hover:shadow-lg transition-all">
              <CardHeader>
                <div className="h-14 w-14 bg-blue-500 rounded-full flex items-center justify-center mb-3 mx-auto">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl text-center">Admin</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Complete system oversight and control</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Team and manager management</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Organization-wide reports and analytics</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>System configuration and settings</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 bg-green-50/50 hover:shadow-lg transition-all">
              <CardHeader>
                <div className="h-14 w-14 bg-green-500 rounded-full flex items-center justify-center mb-3 mx-auto">
                  <UserCog className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl text-center">Manager</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Manage and assign leads to employees</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Monitor team performance and calls</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Review analysis and reports</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Track conversion metrics</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200 bg-purple-50/50 hover:shadow-lg transition-all">
              <CardHeader>
                <div className="h-14 w-14 bg-purple-500 rounded-full flex items-center justify-center mb-3 mx-auto">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl text-center">Employee</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Access assigned leads and groups</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Make calls directly from platform</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>View call analysis and feedback</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Track personal performance</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-white">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="bg-green-100 text-green-700 border-green-200 mb-4">
              🎯 Everything You Need
            </Badge>
            <h2 className="text-4xl font-bold mb-6">
              <span className="text-transparent bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text">
                Powerful Features
              </span> That Drive Results
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From lead capture to AI-powered insights—every tool you need to dominate your market
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-accent-blue transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 bg-accent-blue-light rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-accent-blue" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="px-6 py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 mb-4">
              🏢 Trusted Across Industries
            </Badge>
            <h2 className="text-4xl font-bold mb-6">
              Built for <span className="text-transparent bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text">Every Industry</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From startups to enterprises—businesses across all sectors trust our complete lead-to-analysis platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-accent-blue transition-all duration-300 hover:shadow-lg group">
              <CardHeader>
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">HR Agencies</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Manage candidates as leads, conduct calls directly from the platform, and get detailed conversation analysis for better hiring decisions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent-blue transition-all duration-300 hover:shadow-lg group">
              <CardHeader>
                <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Real Estate</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Manage property leads, conduct client calls directly from the platform, and track engagement with automated analysis.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent-blue transition-all duration-300 hover:shadow-lg group">
              <CardHeader>
                <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Customer Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Manage support tickets as leads, handle calls through the platform, and automatically analyze customer interactions for quality assurance.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent-blue transition-all duration-300 hover:shadow-lg group">
              <CardHeader>
                <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Lead Qualification & Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Manage leads end-to-end: organize, assign, call, and analyze. Track conversion rates with complete workflow automation.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent-blue transition-all duration-300 hover:shadow-lg group">
              <CardHeader>
                <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Banking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Ensure compliance, improve customer relationships, and enhance loan consultations with comprehensive call analysis.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent-blue transition-all duration-300 hover:shadow-lg group">
              <CardHeader>
                <div className="h-12 w-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Customer & Business Operations</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Optimize operational efficiency, improve customer interactions, and drive business growth with actionable call insights.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-orange-100 text-orange-700 border-orange-200 mb-4">
                💎 Premium Experience
              </Badge>
              <h2 className="text-4xl font-bold mb-6">
                Why Teams <span className="text-transparent bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text">Love Tasknova</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join hundreds of high-performing teams who've revolutionized their sales with our intelligent platform.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <Card className="text-center p-6 border-2 border-blue-200 hover:border-blue-400 transition-all hover:shadow-xl">
                <div className="text-4xl font-bold text-accent-blue mb-2">90%</div>
                <div className="text-sm text-muted-foreground font-medium">Time Savings</div>
                <div className="text-xs text-gray-500 mt-1">vs manual review</div>
              </Card>
              <Card className="text-center p-6 border-2 border-green-200 hover:border-green-400 transition-all hover:shadow-xl">
                <div className="text-4xl font-bold text-success mb-2">3.2x</div>
                <div className="text-sm text-muted-foreground font-medium">Conversion Rate</div>
                <div className="text-xs text-gray-500 mt-1">average increase</div>
              </Card>
              <Card className="text-center p-6 border-2 border-orange-200 hover:border-orange-400 transition-all hover:shadow-xl">
                <div className="text-4xl font-bold text-warning mb-2">&lt;5m</div>
                <div className="text-sm text-muted-foreground font-medium">Analysis Time</div>
                <div className="text-xs text-gray-500 mt-1">instant insights</div>
              </Card>
              <Card className="text-center p-6 border-2 border-purple-200 hover:border-purple-400 transition-all hover:shadow-xl">
                <div className="text-4xl font-bold text-purple-600 mb-2">500+</div>
                <div className="text-sm text-muted-foreground font-medium">Active Teams</div>
                <div className="text-xs text-gray-500 mt-1">growing daily</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-6 py-24 bg-gradient-to-br from-accent-blue via-blue-600 to-purple-600 text-white overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative mx-auto max-w-4xl text-center">
          <Badge className="bg-white/20 text-white border-white/30 mb-6 backdrop-blur-sm">
            🎉 Join 500+ Teams Already Winning
          </Badge>
          <h2 className="text-5xl font-bold mb-6 leading-tight">
            Ready to <span className="text-yellow-300">10x</span> Your Sales Game?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Start managing leads, making intelligent calls, and getting AI-powered insights in minutes. 
            No complex setup, no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              size="xl" 
              variant="secondary"
              onClick={onGetStarted}
              className="bg-white text-accent-blue hover:bg-gray-100 shadow-2xl hover:scale-105 transition-all text-lg px-8 py-6"
            >
              Start Free Trial Today
              <ArrowRight className="h-6 w-6 ml-2" />
            </Button>
            <Button 
              size="xl" 
              onClick={onLogin}
              className="border-2 border-white !text-white hover:bg-white/10 hover:!text-white text-lg px-8 py-6 bg-transparent"
            >
              Schedule Demo
              <Zap className="h-6 w-6 ml-2" />
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm text-blue-100">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-300" />
              <span>No credit card</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-300" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-300" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img 
                src="/logo.png" 
                alt="Tasknova" 
                className="h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                onError={(e) => {
                  e.currentTarget.src = "/logo2.png";
                }}
                onClick={() => window.location.href = '/'}
              />
              <div>
                <p className="font-semibold text-foreground">Tasknova</p>
                <p className="text-sm text-muted-foreground">Complete Lead Management & AI Analysis Platform</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-muted-foreground">
                © 2025 Tasknova. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}