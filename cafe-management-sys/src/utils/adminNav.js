/** Auth TextField mobile a11y defaults (16px input prevents iOS zoom-on-focus). */
export const authTextFieldSx = {
  '& .MuiInputBase-input': { fontSize: '16px' },
  mb: 2,
};

export const autocompleteFor = (name) => {
  if (name === 'password') return 'current-password';
  if (name === 'email') return 'email';
  if (name === 'firstName') return 'given-name';
  if (name === 'lastName') return 'family-name';
  return 'on';
};
