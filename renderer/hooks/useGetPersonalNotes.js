import { useEffect, useState } from 'react';

export function useGetPersonalNotes({ id }) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([]);
  const mutate = () => {
    const notes = window.electronAPI.getNotes('personal-notes');
    setData(notes);
  };
  useEffect(() => {
    mutate();
    setIsLoading(false);
  }, [id]);

  return { isLoading, data, mutate };
}
