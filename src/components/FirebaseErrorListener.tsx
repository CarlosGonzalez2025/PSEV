'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * Logs the error as a warning instead of throwing (which would crash the entire React tree).
 * Individual components should handle errors locally via the `error` field from useCollection/useDoc.
 */
export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Log en consola en lugar de crashear toda la app
      console.warn(
        `[FirebaseErrorListener] Permiso denegado: ${error.request?.method} en "${error.request?.path}".`,
        'Verifica que las reglas de Firestore estén publicadas correctamente.',
        error.message
      );
    };

    errorEmitter.on('permission-error', handleError);
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null;
}

