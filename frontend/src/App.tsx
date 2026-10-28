import { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { currentUser, isAdmin } from './auth';
import Layout from './components/Layout';
import AdminPage from './pages/AdminPage';
import BookPage from './pages/BookPage';
import CataloguePage from './pages/CataloguePage';
import LoansPage from './pages/LoansPage';
import LoginPage from './pages/LoginPage';

function RequireAuth({ children, admin = false }: { children: ReactElement; admin?: boolean }) {
    if (!currentUser()) {
        return <Navigate to="/login" replace />;
    }
    return admin && !isAdmin() ? <Navigate to="/" replace /> : children;
}

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RequireAuth><Layout /></RequireAuth>}>
                <Route path="/" element={<CataloguePage />} />
                <Route path="/books/:id" element={<BookPage />} />
                <Route path="/loans" element={<LoansPage />} />
                <Route path="/admin" element={<RequireAuth admin><AdminPage /></RequireAuth>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
