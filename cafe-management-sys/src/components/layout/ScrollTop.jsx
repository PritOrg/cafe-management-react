import React, { useEffect, useState } from 'react';
import { Fab } from '@mui/material';
import KeyboardArrowUp from '@mui/icons-material/KeyboardArrowUp';

/**
 * Floating "back to top" action. Appears after ~400px of scroll; sits above
 * the mobile bottom nav on phones so it never covers the sticky bar.
 */
const ScrollTop = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <Fab
      size="medium"
      color="primary"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      sx={{
        position: 'fixed',
        right: 16,
        bottom: { xs: 88, md: 16 },
        zIndex: (t) => t.zIndex.appBar - 1,
        display: show ? undefined : 'none',
      }}
    >
      <KeyboardArrowUp />
    </Fab>
  );
};

export default ScrollTop;