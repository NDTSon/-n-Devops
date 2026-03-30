import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import SeasonDecorations from './components/SeasonDecorations';
import SeasonAudioPlayer from './components/SeasonAudioPlayer';
import './themes.css';
import './themes/tet.css';
import './themes/trungthu.css';
import './themes/giangsinh.css';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import BlogListPage from './pages/BlogListPage';
import BlogDetailPage from './pages/BlogDetailPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminUserManagement from './pages/AdminUserManagement';
import CategoryManagement from './pages/CategoryManagement';
import BlogForm from './components/BlogForm';
import MessagesPage from './pages/MessagesPage';
import FollowingFeedPage from './pages/FollowingFeedPage';
import NotificationsPage from './pages/NotificationsPage';
import UserProfilePage from './pages/UserProfilePage';
import UsersPage from './pages/UsersPage';
import SupportPage from './pages/SupportPage';
import AdminSupportPage from './pages/AdminSupportPage';
import ChatWidget from './components/ChatWidget';
import SupportContactWidget from './components/SupportContactWidget';
import { useAuth } from './context/AuthContext';
import { useApiProgress } from './hooks/useApiProgress';

function AppInner() {
    const { user } = useAuth();
    // Attach global progress bar to every API call across all microservices
    useApiProgress();
    return (
        <div className="min-h-screen flex flex-col">
            {/* Season & holiday decorations on corners */}
            <SeasonDecorations />
            <SeasonAudioPlayer />
            <Navbar />
            <main className="flex-1">
                <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<BlogListPage />} />
                        <Route path="/blogs/:id" element={<BlogDetailPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/verify-email" element={<EmailVerificationPage />} />

                        {/* Social Features Routes */}
                        <Route
                            path="/messages"
                            element={
                                <ProtectedRoute>
                                    <MessagesPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/messages/:userId"
                            element={
                                <ProtectedRoute>
                                    <MessagesPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/following"
                            element={
                                <ProtectedRoute>
                                    <FollowingFeedPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/notifications"
                            element={
                                <ProtectedRoute>
                                    <NotificationsPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/support"
                            element={
                                <ProtectedRoute>
                                    <SupportPage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Admin Routes */}
                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute adminOnly>
                                    <AdminDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/create"
                            element={
                                <ProtectedRoute adminOnly>
                                    <BlogForm />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/edit/:id"
                            element={
                                <ProtectedRoute adminOnly>
                                    <BlogForm />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/users"
                            element={
                                <ProtectedRoute allowedRoles={['ADMIN', 'SUPPORT']}>
                                    <AdminUserManagement />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/categories"
                            element={
                                <ProtectedRoute adminOnly>
                                    <CategoryManagement />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/support"
                            element={
                                <ProtectedRoute adminOnly>
                                    <AdminSupportPage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Profile & Discovery */}
                        <Route path="/profile/:userId" element={<UserProfilePage />} />
                        <Route path="/users" element={<UsersPage />} />
                    </Routes>
            </main>
            {/* Global Chat Widget (floating bottom-right) */}
            {user && <ChatWidget />}
            {user && <SupportContactWidget />}
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <ThemeProvider>
                    <Router>
                        <AppInner />
                    </Router>
                </ThemeProvider>
            </ToastProvider>
        </AuthProvider>
    );
}

export default App;
