export const formatAuthorName = (name: string): string => {
  if (!name.startsWith('@')) return name;
  return name.slice(1);
};
