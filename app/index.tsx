import { Redirect } from 'expo-router';

import { routes } from '@/constants/routes';

export default function IndexScreen() {
  return <Redirect href={routes.library} />;
}
