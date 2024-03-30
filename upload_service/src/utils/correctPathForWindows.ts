import path from 'path'

export const correctPathForWindows = (pathString: string) => path.normalize(pathString).replace(/\\/g, '/')