import DailyReview from '../../views/DailyReview';
import ProtectedRoute from '../../components/common/ProtectedRoute';

export const metadata = {
  title: 'EduVisionAI - Daily Review',
};

export default function Page() {
  return <ProtectedRoute><DailyReview /></ProtectedRoute>;
}
