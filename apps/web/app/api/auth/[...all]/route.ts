import { getServices } from '../../../../lib/services';

// Better Auth endpoints (sign-in codes, two-factor, session). Never cached.
export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  return getServices().auth.handler(request);
}

export function POST(request: Request) {
  return getServices().auth.handler(request);
}
