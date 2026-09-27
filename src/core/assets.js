export function asset(path) {
  return `${import.meta.env.BASE_URL}${String(path).replace(/^\/+/, '')}`;
}

export const CANON_ASSETS = {
  cd: asset('canon/cd.png'),
  sideBCase: asset('canon/side-b-case.png'),
  firstDatePhoto: asset('canon/photo.png'),
};
