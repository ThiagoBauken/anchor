import { notFound } from 'next/navigation';
import { getPublicSettingsByToken } from '@/app/actions/public-actions';
import { logPublicView } from '@/app/actions/public-actions';
import { headers } from 'next/headers';
import PublicProjectView from '@/components/public-project-view';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicProjectPage({ params }: PageProps) {
  const { token } = await params;

  // Get public settings by token
  const publicSettings = await getPublicSettingsByToken(token);

  if (!publicSettings || !publicSettings.isPublic) {
    notFound();
  }

  // Log the public view (analytics)
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || undefined;
  const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined;

  // Detect device type
  const deviceType = userAgent?.toLowerCase().includes('mobile')
    ? 'mobile'
    : userAgent?.toLowerCase().includes('tablet')
    ? 'tablet'
    : 'desktop';

  // Log view asynchronously (don't await to avoid slowing page load)
  logPublicView(publicSettings.projectId, {
    userAgent,
    ipAddress,
    deviceType
  }).catch(err => console.error('Failed to log public view:', err));

  return (
    <PublicProjectView
      project={(publicSettings as any).project}
      settings={publicSettings as any}
    />
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const { token } = await params;
  const publicSettings = await getPublicSettingsByToken(token);

  if (!publicSettings || !publicSettings.isPublic) {
    return {
      title: 'Projeto não encontrado',
      description: 'Este projeto não está disponível publicamente.'
    };
  }

  const project = (publicSettings as any).project;
  return {
    title: `${project?.name || 'Projeto'} - Inspeção de Ancoragens`,
    description: publicSettings.welcomeMessage || `Visualize o histórico de inspeções de ancoragem do ${project?.name || 'projeto'}`,
    robots: 'noindex, nofollow', // Don't index public inspection pages
  };
}
