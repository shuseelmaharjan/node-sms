"use client";

import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, Calendar, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  
  console.log('Dashboard page rendered successfully', { user: Boolean(user) });

  const stats = [
    {
      title: "Total Students",
      value: "1,234",
      change: "+12%",
      changeText: "from last month",
      icon: Users,
    },
    {
      title: "Active Courses",
      value: "45",
      change: "+8%",
      changeText: "from last month",
      icon: BookOpen,
    },
    {
      title: "Events This Month",
      value: "12",
      change: "+3",
      changeText: "new this week",
      icon: Calendar,
    },
    {
      title: "Attendance Rate",
      value: "94.2%",
      change: "+2.1%",
      changeText: "vs last month",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.email || 'Admin'}</h1>
        <p className="text-muted-foreground mt-2">
          Here's what's happening at your institute today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-emerald-600">{stat.change}</span> {stat.changeText}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>
              Latest activities across the institute
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New student enrollment</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Assignment submitted</p>
                  <p className="text-xs text-muted-foreground">5 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Course schedule updated</p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <button className="flex items-center justify-start space-x-2 text-left p-2 rounded-md hover:bg-accent transition-colors">
                <Users className="h-4 w-4" />
                <span className="text-sm">Add New Student</span>
              </button>
              <button className="flex items-center justify-start space-x-2 text-left p-2 rounded-md hover:bg-accent transition-colors">
                <BookOpen className="h-4 w-4" />
                <span className="text-sm">Create Course</span>
              </button>
              <button className="flex items-center justify-start space-x-2 text-left p-2 rounded-md hover:bg-accent transition-colors">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Schedule Event</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Welcome Message for Admin */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🏫</span>
            <span>Institute Management Dashboard</span>
          </CardTitle>
          <CardDescription>
            Manage your educational institution efficiently
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Welcome to your institute management dashboard. Use the sidebar navigation to access different sections 
            such as student management, course administration, faculty management, and more.
          </p>
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              <strong>Getting Started:</strong> Explore the navigation menu to manage students, courses, faculty, 
              library resources, attendance tracking, and generate comprehensive reports.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}