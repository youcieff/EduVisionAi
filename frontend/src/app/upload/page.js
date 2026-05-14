import Upload from '../../views/Upload';
import ProtectedRoute from '../../components/common/ProtectedRoute';

export const metadata = {
  title: 'EduVisionAI - Upload',
};

export default function Page() {
  return <ProtectedRoute><Upload /></ProtectedRoute>;
}
