import { QuestionDiscussion } from './question-discussion.model';

export function getMockQuestionDiscussion(questionId: string): QuestionDiscussion {
  return {
    questionId,
    comments: [
      {
        id: 'mock-comment-1',
        authorName: 'Mariana Torres',
        authorRole: 'Estudiante SAA',
        authorInitials: 'MT',
        content: 'Seleccioné AWS Direct Connect porque el escenario menciona rendimiento predecible y conectividad estable. La respuesta oficial indica Site-to-Site VPN, pero considero que Direct Connect también podría cumplir los requisitos.',
        supportedOptionId: 'AWS Direct Connect',
        referenceUrl: 'https://docs.aws.amazon.com/directconnect/latest/UserGuide/Welcome.html',
        helpfulCount: 8,
        createdAtLabel: 'Hace 2 días',
        isTeamResponse: false,
        replies: [
          {
            id: 'mock-reply-1',
            authorName: 'Diego Ramos',
            authorRole: 'Arquitecto cloud',
            authorInitials: 'DR',
            content: 'Direct Connect sería técnicamente posible, pero el escenario también prioriza una implementación rápida y menor costo inicial. Por eso Site-to-Site VPN es la mejor respuesta entre las opciones disponibles.',
            supportedOptionId: 'AWS Site-to-Site VPN',
            helpfulCount: 5,
            createdAtLabel: 'Hace 1 día',
            isTeamResponse: false,
            replies: [],
          },
        ],
      },
      {
        id: 'mock-team-1',
        authorName: 'Equipo de CloudCase Hub',
        authorRole: 'Respuesta del equipo de CloudCase Hub',
        authorInitials: 'CH',
        content: 'La clave del escenario es distinguir entre la conectividad dedicada, que requiere planificación, y una conexión VPN que puede desplegarse con mayor rapidez. La respuesta recomendada considera todas las restricciones indicadas.',
        helpfulCount: 11,
        createdAtLabel: 'Hace 18 horas',
        isTeamResponse: true,
        replies: [],
      },
    ],
  };
}
