# Diagramas de Secuencia: Arquitectura Backend (MicroservicioAutos)

A continuación, se presentan los diagramas de secuencia que ilustran el flujo de las peticiones a través de las diferentes capas del proyecto `.NET 8`. Estos diagramas están diseñados para ser copiados o exportados como imágenes para tu documento de Word.

---

## 1. Flujo de Creación de un Registro (Ejemplo: Módulo de Clientes)

Este diagrama detalla paso a paso cómo viaja la información desde que el usuario envía los datos para crear un nuevo Cliente, pasando por todas las capas de validación, lógica de negocio y finalmente guardándose en la base de datos SQL.

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Frontend / Cliente
    participant API as ClienteController (API)
    participant BL as ClienteService (Business)
    participant Val as ClienteValidator (Business)
    participant DM as ClienteDataService (DataManagement)
    participant DA as ClienteRepository (DataAccess)
    participant DB as Base de Datos (SQL Server)

    Usuario->>API: POST /api/v1/clientes (ClienteRequestDTO)
    
    %% Middleware global asume el control inicial (no graficado para simplificar)
    
    API->>BL: CreateClienteAsync(ClienteRequestDTO)
    
    %% Validación de Reglas de Negocio
    BL->>Val: ValidateAsync(ClienteRequestDTO)
    alt Falla la validación
        Val-->>BL: Validation Result (Errores)
        BL-->>API: Lanza CustomValidationException (400)
        API-->>Usuario: HTTP 400 Bad Request (Errores detallados)
    else Validación Exitosa
        Val-->>BL: Validation Result (OK)
        
        %% Mapeo DTO a DataModel
        BL->>BL: Mapear: ClienteRequestDTO -> ClienteDataModel
        
        %% Interacción con Data Management
        BL->>DM: InsertAsync(ClienteDataModel)
        
        %% Data Management delega a Data Access (EF Core)
        DM->>DM: Mapear: ClienteDataModel -> ClienteEntity
        DM->>DA: AddAsync(ClienteEntity)
        DA-->>DM: Entidad Atachada al Contexto
        DM->>DA: SaveChangesAsync() (UnitOfWork)
        
        %% Inserción real en base de datos
        DA->>DB: INSERT INTO Clientes (...)
        DB-->>DA: Filas afectadas (ID Generado)
        
        DA-->>DM: Cambios guardados (Entity con ID)
        DM->>DM: Mapear: ClienteEntity -> ClienteDataModel
        DM-->>BL: ClienteDataModel (con ID asignado)
        
        %% Mapeo final y Respuesta
        BL->>BL: Mapear: ClienteDataModel -> ClienteResponseDTO
        BL-->>API: ClienteResponseDTO
        API-->>Usuario: HTTP 201 Created (ClienteResponseDTO)
    end
```

---

## 2. Flujo de Consulta / Listado (Ejemplo: Obtener Cliente por ID)

Este diagrama ilustra una lectura de base de datos. Es un flujo más directo y rápido, ya que usualmente no requiere validaciones de guardado complejas, aunque sí pasa por las capas arquitectónicas para respetar el diseño.

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Frontend / Cliente
    participant API as ClienteController (API)
    participant BL as ClienteService (Business)
    participant DM as ClienteDataService (DataManagement)
    participant DA as ClienteRepository (DataAccess)
    participant DB as Base de Datos (SQL Server)

    Usuario->>API: GET /api/v1/clientes/{id}
    
    API->>BL: GetClienteByIdAsync(id)
    
    BL->>DM: GetByIdAsync(id)
    
    DM->>DA: FindByIdAsync(id)
    
    DA->>DB: SELECT * FROM Clientes WHERE Id = {id}
    
    alt Cliente No Encontrado
        DB-->>DA: null
        DA-->>DM: null
        DM-->>BL: null
        BL-->>API: Lanza NotFoundException (404)
        API-->>Usuario: HTTP 404 Not Found
    else Cliente Encontrado
        DB-->>DA: Registro SQL
        DA-->>DM: ClienteEntity
        
        DM->>DM: Mapear: ClienteEntity -> ClienteDataModel
        DM-->>BL: ClienteDataModel
        
        BL->>BL: Mapear: ClienteDataModel -> ClienteResponseDTO
        BL-->>API: ClienteResponseDTO
        
        API-->>Usuario: HTTP 200 OK (ClienteResponseDTO)
    end
```

---

## 3. Funcionamiento Global de un Request (Intervención de Middlewares)

Este diagrama es útil para documentar cómo la arquitectura maneja aspectos transversales (Errores y Auditoría) antes de llegar a los Controladores de la API.

```mermaid
sequenceDiagram
    actor Usuario as Frontend
    participant MidAuth as JwtMiddleware (Auth)
    participant MidAudit as AuditoriaMiddleware
    participant MidExc as ExceptionMiddleware
    participant API as Controllers (Capa API)
    participant Negocio as Capas de Negocio/Datos

    Usuario->>MidAuth: Request HTTP (Token)
    
    alt Token Inválido o Ausente
        MidAuth-->>Usuario: HTTP 401 Unauthorized / 403 Forbidden
    else Token Válido
        MidAuth->>MidAudit: Request HTTP
        MidAudit->>MidAudit: Inicia cronómetro y registra inicio de ejecución
        
        MidAudit->>MidExc: Continúa el flujo
        
        MidExc->>API: Ejecuta Controller
        API->>Negocio: Ejecuta Lógica Completa
        
        alt Ocurre un Error de Negocio o Sistema
            Negocio-->>MidExc: Lanza Excepción (ej. BusinessException)
            MidExc->>MidExc: Captura Error, loguea detalles
            MidExc-->>MidAudit: Retorna Respuesta de Error (ej. HTTP 400)
        else Flujo Exitoso
            Negocio-->>API: Datos Procesados
            API-->>MidExc: Retorna Respuesta Exitosa (ej. HTTP 200)
            MidExc-->>MidAudit: Retorna Respuesta Exitosa
        end
        
        MidAudit->>MidAudit: Calcula tiempo de ejecución y guarda log (Auditoría)
        MidAudit-->>Usuario: Respuesta Final (JSON)
    end
```
