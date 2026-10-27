import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import ApiProvider from './api/ApiProvider';
import LoginForm from './components/login-form/LoginForm';
import HomePage from './components/home-page/HomePage';
import ListOfBooks from './components/list-of-books/ListOfBooks';
import ListOfLoans from './components/list-of-loans/ListOfLoans';
import AdminPanel from './components/admin-panel/AdminPanel';
import { currentUser, isAdmin } from './auth';

function RequireAuth({ children, admin = false }: { children: React.ReactElement; admin?: boolean }) {
    if (!currentUser()) {
        return <Navigate to="/login" replace />;
    }
    if (admin && !isAdmin()) {
        return <Navigate to="/home" replace />;
    }
    return children;
}

function App() {
    return (
        <BrowserRouter>
            <I18nextProvider i18n={i18n}>
                <ApiProvider>
                    <Routes>
                        <Route path="/" element={<Navigate to={currentUser() ? '/home' : '/login'} replace />} />
                        <Route path="/login" element={<LoginForm />} />
                        <Route path="/home" element={<RequireAuth><HomePage /></RequireAuth>} />
                        <Route path="/books" element={<RequireAuth><ListOfBooks /></RequireAuth>} />
                        <Route path="/loans" element={<RequireAuth><ListOfLoans /></RequireAuth>} />
                        <Route path="/admin" element={<RequireAuth admin><AdminPanel /></RequireAuth>} />
                        <Route path="*" element={<h1>Error 404: Page Not Found</h1>} />
                    </Routes>
                </ApiProvider>
            </I18nextProvider>
        </BrowserRouter>
    );
}

export default App;
