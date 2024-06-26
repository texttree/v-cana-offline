import { useEffect, useState } from 'react';

export function useGetTnResource({ id, resource, mainResource, chapter, wholeChapter }) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([]);
  useEffect(() => {
    const tn = window.electronAPI.getTN(id, resource, mainResource, chapter);
    if (wholeChapter === false) {
      const verses = window.electronAPI.getChapter(id, chapter);
      const versesEnabled = Object.keys(verses).reduce((acc, key) => {
        acc[key] = verses[key].enabled;
        return acc;
      }, {});
      setData(tn.filter((v) => versesEnabled[v.verse]));
    } else { setData(tn) }
    setIsLoading(false);
  }, [id, resource, chapter]);

  return { isLoading, data };
}
