export * from './speechService';

export const announceStudentWinner = (name: string, template?: any) => {
  import('./speechService').then(m => m.speechService.announceStudentWinner(name, template));
};

export const announceMultipleWinners = (names: string[]) => {
  import('./speechService').then(m => m.speechService.announceMultipleWinners(names));
};
