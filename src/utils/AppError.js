// erro de negocio esperado (ex: credenciais invalidas, email duplicado) -
// carrega o status HTTP certo, diferente de um erro inesperado (bug, falha
// de rede) que deve virar 500 generico no errorHandler
export class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}
