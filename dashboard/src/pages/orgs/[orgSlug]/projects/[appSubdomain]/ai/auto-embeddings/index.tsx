/* eslint-disable import/extensions */
import { UpgradeToProBanner } from '@/components/common/UpgradeToProBanner';
import { Container } from '@/components/layout/Container';
import { ActivityIndicator } from '@/components/ui/v2/ActivityIndicator';
import { Alert } from '@/components/ui/v2/Alert';
import { Box } from '@/components/ui/v2/Box';
import { Link } from '@/components/ui/v2/Link';
import { Text } from '@/components/ui/v2/Text';

import { type GetAssistantsQuery } from '@/utils/__generated__/graphite.graphql';
import { useEffect, useRef, type ReactElement } from 'react';

import { RetryableErrorBoundary } from '@/components/presentational/RetryableErrorBoundary';
import { AISidebar } from '@/features/orgs/layout/AISidebar';
import { ProjectLayout } from '@/features/orgs/layout/ProjectLayout';
import { useIsGraphiteEnabled } from '@/features/orgs/projects/common/hooks/useIsGraphiteEnabled';
import { useIsPlatform } from '@/features/orgs/projects/common/hooks/useIsPlatform';
import { useCurrentOrg } from '@/features/orgs/projects/hooks/useCurrentOrg';
import { useProject } from '@/features/orgs/projects/hooks/useProject';
import { useNhostClient } from '@nhost/nextjs';

export type Assistant = Omit<
  GetAssistantsQuery['graphite']['assistants'][0],
  '__typename'
>;

export default function AutoEmbeddingsPage() {
  const isPlatform = useIsPlatform();
  const { isGraphiteEnabled, loading: loadingGraphite } =
    useIsGraphiteEnabled();

  const { org, loading: loadingOrg } = useCurrentOrg();
  const { project, loading: loadingProject } = useProject();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const nhost = useNhostClient();

  useEffect(() => {
    const session = nhost?.auth?.getSession();
    if (!session) {
      return;
    }
    window.addEventListener('message', async (event) => {
      // if (event.origin !== 'https://your-allowed-origin.com') return;
      const { type } = event.data;
      if (type === 'GRAPHITE_READY') {
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'NHOST_SESSION', payload: session },
          '*',
        );
      }
    });
  }, [nhost?.auth]);

  // useEffect(() => {
  //   const session = nhost.auth.getSession();
  //   if (session) {
  //     console.log('session', session);
  //     iframeRef.current?.contentWindow?.postMessage(
  //       { type: 'NHOST_SESSION_CLIENT', payload: nhost },
  //       '*',
  //     );
  //     console.log('postMessage', session.accessToken);
  //   }
  // }, [nhost]);

  if (loadingOrg || loadingProject || loadingGraphite) {
    return (
      <Box className="flex h-full w-full items-center justify-center">
        <ActivityIndicator
          delay={1000}
          label="Loading Assistants..."
          className="justify-center"
        />
      </Box>
    );
  }

  if (isPlatform && org?.plan?.isFree) {
    return (
      <Container
        className="grid grid-flow-row gap-6 bg-transparent"
        rootClassName="bg-transparent"
      >
        <UpgradeToProBanner
          title="To unlock Nhost Assistants, transfer this project to a Pro or Team organization."
          description=""
        />
      </Container>
    );
  }

  if (
    (isPlatform && !org?.plan?.isFree && !project.config?.ai) ||
    !isGraphiteEnabled
  ) {
    return (
      <Box
        className="w-full p-4"
        sx={{ backgroundColor: 'background.default' }}
      >
        <Alert className="grid w-full grid-flow-col place-content-between items-center gap-2">
          <Text className="grid grid-flow-row justify-items-start gap-0.5">
            <Text component="span">
              To enable graphite, configure the service first in{' '}
              <Link
                href={`/orgs/${org?.slug}/projects/${project?.subdomain}/settings/ai`}
                rel="noopener noreferrer"
                underline="hover"
              >
                AI Settings
              </Link>
              .
            </Text>
          </Text>
        </Alert>
      </Box>
    );
  }

  return (
    <Container
      className="grid max-w-5xl grid-flow-row gap-y-6 bg-transparent"
      rootClassName="bg-transparent"
    >
      <iframe
        ref={iframeRef}
        // src="https://graphite-ui-iframe.vercel.app/auto-embeddings"
        src={`http://localhost:3000/orgs/${org?.slug}/projects/${project?.subdomain}/auto-embeddings`}
        title="Graphite UI"
        width="100%"
        height="600px"
        style={{ border: 'none' }}
      />
    </Container>
  );
}

AutoEmbeddingsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <ProjectLayout
      mainContainerProps={{ className: 'flex flex-row w-full h-full' }}
    >
      <AISidebar className="w-full max-w-sidebar" />
      <RetryableErrorBoundary>{page}</RetryableErrorBoundary>
    </ProjectLayout>
  );
};
