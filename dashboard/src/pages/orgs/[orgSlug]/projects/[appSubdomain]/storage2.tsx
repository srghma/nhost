import { LoadingScreen } from '@/components/presentational/LoadingScreen';
import { StoragePage } from '@/components/remote/StoragePage';
import { useColorPreference } from '@/components/ui/v2/useColorPreference';
import { ProjectLayout } from '@/features/orgs/layout/ProjectLayout';
import { useProject } from '@/features/orgs/projects/hooks/useProject';
import { useNhostClient } from '@nhost/nextjs';
import { type ReactElement } from 'react';

export default function StoragePageMEF() {
  const { project, loading } = useProject();
  const nhost = useNhostClient();

  const session = nhost.auth.getSession();

  const { color: colorScheme } = useColorPreference();

  if (!project || loading) {
    return <LoadingScreen />;
  }

  return <StoragePage nhostSession={session} colorScheme={colorScheme} />;
}

StoragePageMEF.getLayout = function getLayout(page: ReactElement) {
  return <ProjectLayout>{page}</ProjectLayout>;
};
