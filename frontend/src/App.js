import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/common/Header';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Loading from './components/common/Loading';
import AIChatButton from './components/features/AIChatButton';
import './App.css';

// Lazy load pages để tối ưu bundle size
const Home = lazy(() => import('./pages/Home'));
const ComicsList = lazy(() => import('./pages/ComicsList'));
const ComicDetail = lazy(() => import('./pages/ComicDetail'));
const ChapterReader = lazy(() => import('./pages/ChapterReader'));
const Search = lazy(() => import('./pages/Search'));
const Category = lazy(() => import('./pages/Category'));
const History = lazy(() => import('./pages/History'));
const Favorites = lazy(() => import('./pages/Favorites'));
const AdminComics = lazy(() => import('./pages/AdminComics'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const Profile = lazy(() => import('./pages/Profile'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const SetupPassword = lazy(() => import('./pages/SetupPassword'));
const GoogleRegistrationSuccess = lazy(() => import('./pages/GoogleRegistrationSuccess'));
const GoogleAuthCallback = lazy(() => import('./pages/GoogleAuthCallback'));
const Ranking = lazy(() => import('./pages/Ranking'));
const AdvancedSearch = lazy(() => import('./pages/AdvancedSearch'));
const Payment = lazy(() => import('./pages/Payment'));

function AppContent() {
  const location = useLocation();
  const isChapterReader = location.pathname.startsWith('/chapter/');
  
  // Extract comicId and chapterId from URL for AI chat context
  const comicIdMatch = location.pathname.match(/\/comic\/(\d+)/);
  const chapterIdMatch = location.pathname.match(/\/chapter\/(\d+)/);
  const comicId = comicIdMatch ? comicIdMatch[1] : null;
  const chapterId = chapterIdMatch ? chapterIdMatch[1] : null;

  return (
    <div className="App">
      <Header />
      <Navbar />
      <main className={`main-content ${isChapterReader ? 'chapter-mode' : ''}`}>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/comics" element={<ComicsList />} />
            <Route path="/comic/:id" element={<ComicDetail />} />
            <Route path="/chapter/:id" element={<ChapterReader />} />
            <Route path="/search" element={<Search />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/advanced-search" element={<AdvancedSearch />} />
            <Route path="/category/:id" element={<Category />} />
            <Route path="/history" element={<History />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin/comics" element={<AdminComics />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/setup-password" element={<SetupPassword />} />
            <Route path="/google-registration-success" element={<GoogleRegistrationSuccess />} />
            <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
            <Route path="/payment/upgrade" element={<Payment />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <AIChatButton comicId={comicId} chapterId={chapterId} />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

