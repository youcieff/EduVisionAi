import Profile from '../../views/Profile';
import ProtectedRoute from '../../components/common/ProtectedRoute';

export const metadata = {
  title: 'EduVisionAI - Profile',
};

export default function Page() {
  return <ProtectedRoute><Profile /></ProtectedRoute>;
}
