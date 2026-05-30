import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { buildUrl } from '../config/api';

export default function ProtectedExamRoute({ children }) {
  const [ok, setOk] = useState(null);

  useEffect(() => {
    const check = async () => {
      const token = localStorage.getItem('examSession');
      if (!token) return setOk(false);
      try {
        const res = await fetch(buildUrl(`/api/exam/session/${token}`));
        if (!res.ok) return setOk(false);
        const data = await res.json();
        if (data && data.session && !data.session.completed) {
          setOk(true);
        } else setOk(false);
      } catch (err) {
        setOk(false);
      }
    };
    check();
  }, []);

  if (ok === null) return <div />; // loading
  if (!ok) return <Navigate to="/" replace />;
  return children;
}
