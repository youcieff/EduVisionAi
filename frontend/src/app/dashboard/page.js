import Dashboard from '../../views/Dashboard';
import ProtectedRoute from '../../components/common/ProtectedRoute';

export const metadata = {
  title: 'EduVisionAI - Dashboard',
};

export default function Page() {
  return <ProtectedRoute><Dashboard /></ProtectedRoute>;
}
