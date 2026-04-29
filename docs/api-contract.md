COntrato de respuesta de api 
**Formato común**
Respuesta exitosa:
```json
{
  "success": true,
  "message": "Operacion exitosa",
  "data": {},
  "errors": []
}
```

Respuesta error:
```json
{
  "success": false,
  "message": "Mensaje de error",
  "errors": ["detalle 1", "detalle 2"]
}
```

Respuesta paginada:
```json
{
  "success": true,
  "message": "Operacion exitosa",
  "data": {
    "items": [],
    "pageNumber": 1,
    "pageSize": 10,
    "totalRecords": 0,
    "totalPages": 0
  },
  "errors": []
}
```

## 1. Auth

### `POST /api/v1/auth/login`
Hace: inicia sesión y devuelve JWT.

Request:
```json
{
  "username": "admin",
  "password": "123456"
}
```

Response:
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "idUsuario": 1,
    "username": "admin",
    "correo": "admin@correo.com",
    "activo": true,
    "roles": ["ADMINISTRADOR"],
    "token": "jwt...",
    "expirationUtc": "2026-04-28T20:00:00Z"
  },
  "errors": []
}
```

### `POST /api/v1/auth/register-cliente`
Hace: registra cliente + usuario + rol `CLIENTE`.

Request:
```json
{
  "username": "cliente01",
  "correo": "cliente@correo.com",
  "password": "123456",
  "cliTipoIdentificacion": "CED",
  "cliNumeroIdentificacion": "1234567890",
  "cliNombres": "Juan",
  "cliApellidos": "Perez",
  "cliRazonSocial": null,
  "cliCorreoElectronico": "cliente@correo.com",
  "cliTelefono": "0999999999",
  "cliDireccion": "Quito",
  "cliEsPersonaJuridica": false
}
```

Response:
```json
{
  "success": true,
  "message": "Cliente registrado",
  "data": {
    "idUsuario": 10,
    "idCliente": 20,
    "username": "cliente01",
    "correo": "cliente@correo.com",
    "token": "jwt...",
    "expirationUtc": "2026-04-28T20:00:00Z",
    "roles": ["CLIENTE"]
  },
  "errors": []
}
```

### `POST /api/v1/auth/logout`
Hace: confirma cierre de sesión.

Request: sin body.

Response:
```json
{
  "success": true,
  "message": "Sesión cerrada. Elimine el token almacenado en el cliente.",
  "data": null,
  "errors": []
}
```

## 2. Vehículos

Base: `/api/v1/vehiculos`

### `GET /`
Hace: lista vehículos.

Query:
- `soloActivos`
- `inactivosAlFinal`

Response: `ApiResponse<VehiculoResponse[]>`

### `GET /consulta`
Hace: búsqueda paginada.

Query/Body equivalente:
```json
{
  "parametro": "toyota",
  "placaVehiculo": null,
  "codigoInternoVehiculo": null,
  "idMarca": null,
  "idCategoria": null,
  "localizacionActual": null,
  "estadoVehiculo": null,
  "tipoCombustible": null,
  "tipoTransmision": null,
  "soloActivos": true,
  "inactivosAlFinal": true,
  "pageNumber": 1,
  "pageSize": 10
}
```

### `GET /{id}`
Hace: obtiene detalle de vehículo.

### `POST /`
Hace: crea vehículo.

Request:
```json
{
  "placaVehiculo": "ABC1234",
  "codigoInternoVehiculo": "VH-001",
  "idMarca": 1,
  "idCategoria": 2,
  "localizacionActual": 1,
  "modeloVehiculo": "Corolla",
  "añoFabricacion": 2024,
  "colorVehiculo": "Blanco",
  "tipoCombustible": "Gasolina",
  "tipoTransmision": "Automatica",
  "capacidadPasajeros": 5,
  "capacidadMaletas": 3,
  "numeroPuertas": 4,
  "precioBaseDia": 45.50,
  "kilometrajeActual": 12000,
  "creadoPorUsuario": "admin",
  "origenRegistro": "web"
}
```

### `PUT /{id}`
Hace: actualiza vehículo.

Query:
- `forzarCambioLocalizacion=false`

Request:
```json
{
  "idVehiculo": 1,
  "placaVehiculo": "ABC1234",
  "idMarca": 1,
  "idCategoria": 2,
  "localizacionActual": 2,
  "modeloVehiculo": "Corolla",
  "añoFabricacion": 2024,
  "colorVehiculo": "Negro",
  "tipoCombustible": "Gasolina",
  "tipoTransmision": "Automatica",
  "capacidadPasajeros": 5,
  "capacidadMaletas": 3,
  "numeroPuertas": 4,
  "precioBaseDia": 48.00,
  "kilometrajeActual": 13000,
  "estadoVehiculo": "DIS"
}
```

### `POST /buscar`
Hace: búsqueda paginada por body.

Body: mismo `VehiculoFiltroRequest`.

### `GET /disponibles`
Hace: busca vehículos disponibles por fechas.

Query:
```json
{
  "localizacionOrigen": 1,
  "fechaInicio": "2026-05-01T08:00:00",
  "fechaFin": "2026-05-03T08:00:00",
  "idCategoria": 2
}
```

### `GET /{id}/disponibilidad`
Hace: verifica si un vehículo está disponible.

Query:
```json
{
  "fechaInicio": "2026-05-01T08:00:00",
  "fechaFin": "2026-05-03T08:00:00"
}
```

Response:
```json
{
  "success": true,
  "message": "Operacion exitosa",
  "data": true,
  "errors": []
}
```

### `POST /{id}/inactivar`
Hace: inactiva vehículo.

### `POST /{id}/activar`
Hace: activa vehículo.

### `POST /{id}/mantenimiento`
Hace: marca vehículo en mantenimiento.

### `POST /{id}/disponible`
Hace: marca vehículo como disponible.

Response típica de cambio de estado:
```json
{
  "success": true,
  "message": "Vehiculo actualizado correctamente",
  "data": {
    "success": true,
    "message": "Vehiculo actualizado correctamente",
    "errors": []
  },
  "errors": []
}
```

### `VehiculoResponse`
Importante: `imagenVehiculo` **sí se genera por defecto en backend** con el formato:

`PLACA.png`

Ejemplo:
- placa `ABC1234`
- imagen `ABC1234.png`

No se envía en create/update, pero sí debe venir en response.

```json
{
  "placaVehiculo": "ABC1234",
  "imagenVehiculo": "https://res.cloudinary.com/mi-cloud/image/upload/v123/vehiculos/ABC123.png",
  "codigoInternoVehiculo": "VH-001",
  "idMarca": 1,
  "idCategoria": 2,
  "localizacionActual": 1,
  "modeloVehiculo": "Corolla",
  "añoFabricacion": 2024,
  "colorVehiculo": "Blanco",
  "tipoCombustible": "Gasolina",
  "tipoTransmision": "Automatica",
  "capacidadPasajeros": 5,
  "capacidadMaletas": 3,
  "numeroPuertas": 4,
  "precioBaseDia": 45.5,
  "kilometrajeActual": 12000,
  "creadoPorUsuario": "admin",
  "origenRegistro": "web"
}

```

## 3. Reservas

Base: `/api/v1/reservas`

### `POST /commerce/disponibilidad-vehiculos`
Hace: búsqueda commerce de vehículos disponibles.

Request:
```json
{
  "idLocalizacion": 1,
  "fechaInicioUtc": "2026-05-01T13:00:00Z",
  "fechaFinUtc": "2026-05-03T13:00:00Z",
  "idCategoriaVehiculo": 2
}
```

Response:
```json
{
  "success": true,
  "message": "Operacion exitosa",
  "data": [
    {
      "vehiculo": {
        "idVehiculo": 1,
        "vehiculoGuid": "guid",
        "codigoInternoVehiculo": "VH-001",
        "placaVehiculo": "ABC1234",
        "imagenVehiculo": "ABC1234.png",
        "idMarca": 1,
        "nombreMarca": "Toyota",
        "idCategoria": 2,
        "nombreCategoria": "SUV",
        "localizacionActual": 1,
        "nombreLocalizacion": "Quito Norte",
        "modeloVehiculo": "Corolla",
        "añoFabricacion": 2024,
        "colorVehiculo": "Blanco",
        "tipoCombustible": "Gasolina",
        "tipoTransmision": "Automatica",
        "capacidadPasajeros": 5,
        "capacidadMaletas": 3,
        "numeroPuertas": 4,
        "precioBaseDia": 45.50,
        "kilometrajeActual": 12000,
        "estadoVehiculo": "DIS",
        "esEliminado": false,
        "fechaRegistroUtc": "2026-04-28T00:00:00Z"
      },
      "diasAlquiler": 2,
      "zonaHorariaLocalizacion": "America/Guayaquil",
      "precioPorDiaCongelado": 45.50,
      "subtotalEstimadoVehiculo": 91.00
    }
  ],
  "errors": []
}
```

### `GET /`
Hace: lista reservas.

### `GET /{id}`
Hace: detalle de reserva.

### `POST /`
Hace: crea reserva.

Request:
```json
{
  "resIdCliente": 20,
  "resIdVehiculo": 1,
  "resFechaInicio": "2026-05-01T08:00:00",
  "resFechaFin": "2026-05-03T08:00:00",
  "resPrecioPorDia": 45.50,
  "resObservacion": "Entrega en aeropuerto",
  "resCreadoPorUsuario": "cliente01"
}
```

### `PUT /{id}`
Hace: actualiza reserva.

Request:
```json
{
  "idReserva": 1,
  "resFechaInicio": "2026-05-02T08:00:00",
  "resFechaFin": "2026-05-04T08:00:00",
  "resPrecioPorDia": 45.50,
  "resEstado": "PEN",
  "resObservacion": "Cambio de fecha",
  "resModificadoPorUsuario": "vendedor1",
  "resModificadoDesde": "web"
}
```

### `POST /buscar`
Hace: búsqueda paginada.

Request:
```json
{
  "resIdCliente": null,
  "resIdVehiculo": null,
  "resEstado": "PEN",
  "fechaDesde": "2026-05-01T00:00:00",
  "fechaHasta": "2026-05-31T23:59:59",
  "resCreadoPorUsuario": null,
  "pageNumber": 1,
  "pageSize": 10
}
```

### `GET /consulta`
Hace: misma búsqueda por query string.

### `POST /{id}/confirmar`
Hace: confirma reserva.

Response:
```json
{
  "success": true,
  "message": "Reserva confirmada",
  "data": {
    "exito": true,
    "mensaje": "Reserva confirmada",
    "idFactura": 12,
    "numeroFactura": "FAC-00012",
    "errores": []
  },
  "errors": []
}
```

### `POST /{id}/cancelar`
Hace: cancela reserva.

### `POST /{id}/reprogramar`
Hace: reprograma reserva.

Request:
```json
{
  "resFechaInicio": "2026-05-05T08:00:00",
  "resFechaFin": "2026-05-07T08:00:00",
  "resObservacion": "Reprogramación",
  "resModificadoPorUsuario": "vendedor1"
}
```

### `POST /{id}/iniciar`
Hace: inicia reserva.

### `POST /{id}/finalizar`
Hace: finaliza reserva.

### `ReservaResponse`
```json
{
  "idReserva": 1,
  "resGuid": "guid",
  "resIdCliente": 20,
  "resIdVehiculo": 1,
  "resFechaInicio": "2026-05-01T08:00:00",
  "resFechaFin": "2026-05-03T08:00:00",
  "resPrecioPorDia": 45.50,
  "resSubtotal": 91.00,
  "resTotalExtra": 10.00,
  "resTotal": 101.00,
  "resEstado": "PEN",
  "resObservacion": "Entrega aeropuerto",
  "resFechaRegistroUtc": "2026-04-28T00:00:00Z",
  "resCreadoPorUsuario": "cliente01",
  "resNumeroPublico": "RES-000001",
  "resExpiracionPendienteUtc": "2026-04-29T00:00:00Z",
  "diasAlquiler": 2,
  "cliente": {
    "idCliente": 20,
    "nombreCompleto": "Juan Perez",
    "tipoIdentificacion": "CED",
    "numeroIdentificacion": "1234567890",
    "correoElectronico": "cliente@correo.com",
    "telefono": "0999999999"
  },
  "vehiculo": {
    "idVehiculo": 1,
    "codigoInternoVehiculo": "VH-001",
    "placaVehiculo": "ABC1234",
    "modeloVehiculo": "Corolla",
    "nombreMarca": "Toyota",
    "nombreCategoria": "SUV",
    "nombreLocalizacion": "Quito Norte",
    "precioBaseDia": 45.50,
    "estadoVehiculo": "DIS"
  },
  "extras": [],
  "conductores": []
}
```

## 4. Reservas extras

Base: `/api/v1/reservas-extras`

### `POST /agregar`
Hace: agrega extra a la reserva.

Request:
```json
{
  "rxeIdReserva": 1,
  "rxeIdExtra": 2,
  "rxeCantidad": 1,
  "rxePrecioPorDia": 5.00
}
```

### `POST /quitar?idReservaXExtra=1`
Hace: quita extra de la reserva.

### `GET /?idReserva=1`
Hace: lista extras de una reserva.

Response:
```json
{
  "success": true,
  "message": "Operacion exitosa",
  "data": [
    {
      "idReservaXExtra": 1,
      "rxeIdReserva": 1,
      "rxeIdExtra": 2,
      "nombreExtra": "GPS",
      "rxeCantidad": 1,
      "rxePrecioPorDia": 5.00,
      "rxeTotal": 10.00,
      "rxeEstado": "ACT",
      "rxeFechaRegistroUtc": "2026-04-28T00:00:00Z"
    }
  ],
  "errors": []
}
```

## 5. Reservas conductores

Base: `/api/v1/reservas-conductores`

### `POST /asignar`
Hace: asigna conductor a reserva.

Request:
```json
{
  "rxcIdReserva": 1,
  "rxcIdConductor": 3,
  "rxcEsPrincipal": true
}
```

### `POST /quitar?idReservaXConductor=1`
Hace: quita conductor de la reserva.

### `GET /?idReserva=1`
Hace: lista conductores de la reserva.

Response:
```json
{
  "success": true,
  "message": "Operacion exitosa",
  "data": [
    {
      "idReservaXConductor": 1,
      "rxcIdReserva": 1,
      "rxcIdConductor": 3,
      "nombreConductor": "Juan Perez",
      "rxcEsPrincipal": true,
      "rxcEstado": "ACT",
      "rxcFechaRegistroUtc": "2026-04-28T00:00:00Z"
    }
  ],
  "errors": []
}
```

## 6. Facturas

Base: `/api/v1/facturas`

### `GET /`
Hace: lista facturas.

### `GET /{id}`
Hace: obtiene detalle de factura.

### `POST /generar`
Hace: genera factura.

Request:
```json
{
  "facIdReserva": 1,
  "facIdCliente": 20,
  "facNumero": "FAC-00012",
  "facSubtotal": 91.00,
  "facImpuesto": 10.92,
  "facTotal": 101.92,
  "facEstado": "EMI",
  "facCreadoPorUsuario": "vendedor1"
}
```

### `POST /buscar`
Hace: búsqueda paginada.

Request:
```json
{
  "facIdCliente": 20,
  "facNumero": null,
  "facEstado": null,
  "facIdReserva": null,
  "facFechaDesde": null,
  "facFechaHasta": null,
  "facCreadoPorUsuario": null,
  "pageNumber": 1,
  "pageSize": 10
}
```

### `GET /consulta`
Hace: búsqueda por query.

### `POST /{id}/anular`
Hace: anula factura.

### `GET /reserva/{reservaId}`
Hace: obtiene factura por reserva.

### `GET /cliente/{clienteId}`
Hace: lista facturas por cliente.

### `GET /{id}/impresion`
Hace: devuelve archivo de impresión.

### `FacturaResponse`
```json
{
  "idFactura": 12,
  "facGuid": "guid",
  "facIdReserva": 1,
  "facIdCliente": 20,
  "facNumero": "FAC-00012",
  "facFechaEmisionUtc": "2026-04-28T00:00:00Z",
  "facSubtotal": 91.00,
  "facImpuesto": 10.92,
  "facTotal": 101.92,
  "facEstado": "EMI",
  "facFechaRegistroUtc": "2026-04-28T00:00:00Z"
}
```

## 7. Países

Base: `/api/v1/paises`

### `GET /`
Hace: lista países.

### `GET /{id}`
Hace: obtiene país.

### `POST /`
Hace: crea país.

Request:
```json
{
  "nombrePais": "Ecuador"
}
```

### `PUT /{id}`
Hace: actualiza país.

Request:
```json
{
  "idPais": 1,
  "nombrePais": "Ecuador"
}
```

### `POST /{id}/inactivar`
Hace: inactiva país.

### `PaisResponse`
```json
{
  "idPais": 1,
  "nombrePais": "Ecuador",
  "estadoPais": "ACT",
  "esEliminado": false
}
```

## 8. Ciudades

Base: `/api/v1/ciudades`

### `GET /`
Hace: lista ciudades.

### `GET /pais/{idPais}`
Hace: lista ciudades por país.

### `GET /{id}`
Hace: obtiene ciudad.

### `POST /`
Hace: crea ciudad.

Request:
```json
{
  "nombreCiudad": "Quito",
  "idPais": 1
}
```

### `PUT /{id}`
Hace: actualiza ciudad.

Request:
```json
{
  "idCiudad": 1,
  "nombreCiudad": "Quito",
  "idPais": 1
}
```

### `POST /buscar`
Hace: búsqueda paginada.

Request:
```json
{
  "nombreCiudad": "Quito",
  "idPais": 1,
  "pageNumber": 1,
  "pageSize": 10
}
```

### `POST /{id}/inactivar`
Hace: inactiva ciudad.

### `CiudadResponse`
```json
{
  "idCiudad": 1,
  "nombreCiudad": "Quito",
  "idPais": 1,
  "nombrePais": "Ecuador",
  "estadoCiudad": "ACT",
  "esEliminado": false
}
```

## 9. Marcas de vehículo

Base: `/api/v1/marcas-vehiculo`

### `GET /`
Hace: lista marcas.

### `GET /{id}`
Hace: obtiene marca.

### `POST /`
Hace: crea marca.

Request:
```json
{
  "nombreMarca": "Toyota"
}
```

### `PUT /{id}`
Hace: actualiza marca.

Request:
```json
{
  "idMarca": 1,
  "nombreMarca": "Toyota"
}
```

### `POST /{id}/inactivar`
Hace: inactiva marca.

### `MarcaVehiculoResponse`
```json
{
  "idMarca": 1,
  "nombreMarca": "Toyota",
  "estadoMarca": "ACT",
  "esEliminado": false
}
```

## 10. Categorías de vehículo

Base: `/api/v1/categorias-vehiculo`

### `GET /`
Hace: lista categorías.

### `GET /{id}`
Hace: obtiene categoría.

### `POST /`
Hace: crea categoría.

Request:
```json
{
  "nombreCategoria": "SUV",
  "descripcionCategoria": "Camioneta deportiva"
}
```

### `PUT /{id}`
Hace: actualiza categoría.

Request:
```json
{
  "idCategoria": 2,
  "nombreCategoria": "SUV",
  "descripcionCategoria": "Camioneta deportiva"
}
```

### `POST /{id}/inactivar`
Hace: inactiva categoría.

### `CategoriaVehiculoResponse`
```json
{
  "idCategoria": 2,
  "nombreCategoria": "SUV",
  "descripcionCategoria": "Camioneta deportiva",
  "estadoCategoria": "ACT",
  "esEliminado": false
}
```

## 11. Localizaciones

Base: `/api/v1/localizaciones`

### `GET /`
Hace: lista localizaciones.

### `GET /consulta`
Hace: búsqueda paginada.

### `GET /{id}`
Hace: detalle de localización.

### `POST /`
Hace: crea localización.

Request:
```json
{
  "nombreLocalizacion": "Quito Norte",
  "idCiudad": 1,
  "direccionLocalizacion": "Av. Ejemplo",
  "telefonoContacto": "022222222",
  "correoContacto": "sede@empresa.com",
  "horarioAtencion": "08:00-18:00",
  "zonaHoraria": "America/Guayaquil",
  "creadoPorUsuario": "admin",
  "origenRegistro": "web"
}
```

### `PUT /{id}`
Hace: actualiza localización.

Request:
```json
{
  "idLocalizacion": 1,
  "nombreLocalizacion": "Quito Norte",
  "idCiudad": 1,
  "direccionLocalizacion": "Av. Ejemplo",
  "telefonoContacto": "022222222",
  "correoContacto": "sede@empresa.com",
  "horarioAtencion": "08:00-18:00",
  "zonaHoraria": "America/Guayaquil",
  "estadoLocalizacion": "ACT",
  "modificadoPorUsuario": "admin"
}
```

### `POST /buscar`
Hace: búsqueda paginada.

### `POST /{id}/inactivar`
Hace: inactiva localización.

### `LocalizacionResponse`
```json
{
  "idLocalizacion": 1,
  "localizacionGuid": "guid",
  "codigoLocalizacion": "LOC-001",
  "nombreLocalizacion": "Quito Norte",
  "idCiudad": 1,
  "nombreCiudad": "Quito",
  "direccionLocalizacion": "Av. Ejemplo",
  "telefonoContacto": "022222222",
  "correoContacto": "sede@empresa.com",
  "horarioAtencion": "08:00-18:00",
  "zonaHoraria": "America/Guayaquil",
  "estadoLocalizacion": "ACT",
  "esEliminado": false,
  "fechaRegistroUtc": "2026-04-28T00:00:00Z"
}
```

## 12. Extras

Base: `/api/v1/extras`

### `GET /`
Hace: lista extras.

### `GET /{id}`
Hace: detalle de extra.

### `POST /`
Hace: crea extra.

Request:
```json
{
  "codigoExtra": "GPS",
  "nombreExtra": "GPS",
  "descripcionExtra": "Navegador satelital",
  "valorFijo": 5.00,
  "creadoPorUsuario": "admin",
  "origenRegistro": "web"
}
```

### `PUT /{id}`
Hace: actualiza extra.

Request:
```json
{
  "idExtra": 1,
  "nombreExtra": "GPS",
  "descripcionExtra": "Navegador satelital",
  "valorFijo": 5.00,
  "estadoExtra": "ACT"
}
```

### `POST /{id}/inactivar`
Hace: inactiva extra.

### `ExtraResponse`
```json
{
  "idExtra": 1,
  "extraGuid": "guid",
  "codigoExtra": "GPS",
  "nombreExtra": "GPS",
  "descripcionExtra": "Navegador satelital",
  "valorFijo": 5.00,
  "estadoExtra": "ACT",
  "esEliminado": false,
  "fechaRegistroUtc": "2026-04-28T00:00:00Z"
}
```

## 13. Conductores

Base: `/api/v1/conductores`

### `GET /`
Hace: lista conductores.

### `GET /consulta`
Hace: búsqueda paginada.

### `GET /{id}`
Hace: detalle de conductor.

### `POST /`
Hace: crea conductor.

Request:
```json
{
  "tipoIdentificacion": "CED",
  "numeroIdentificacion": "1234567890",
  "conNombre1": "Juan",
  "conNombre2": null,
  "conApellido1": "Perez",
  "conApellido2": null,
  "numeroLicencia": "LIC123",
  "fechaVencimientoLicencia": "2027-01-01",
  "edadConductor": 30,
  "conTelefono": "0999999999",
  "conCorreo": "juan@correo.com",
  "creadoPorUsuario": "admin",
  "origenRegistro": "web"
}
```

### `PUT /{id}`
Hace: actualiza conductor.

Request:
```json
{
  "idConductor": 3,
  "conNombre1": "Juan",
  "conNombre2": null,
  "conApellido1": "Perez",
  "conApellido2": null,
  "numeroLicencia": "LIC123",
  "fechaVencimientoLicencia": "2027-01-01",
  "edadConductor": 30,
  "conTelefono": "0999999999",
  "conCorreo": "juan@correo.com",
  "estadoConductor": "ACT",
  "modificadoPorUsuario": "admin"
}
```

### `POST /buscar`
Hace: búsqueda paginada.

### `POST /{id}/inactivar`
Hace: inactiva conductor.

### `ConductorResponse`
```json
{
  "idConductor": 3,
  "conductorGuid": "guid",
  "codigoConductor": "CON-001",
  "tipoIdentificacion": "CED",
  "numeroIdentificacion": "1234567890",
  "conNombre1": "Juan",
  "conNombre2": null,
  "conApellido1": "Perez",
  "conApellido2": null,
  "numeroLicencia": "LIC123",
  "fechaVencimientoLicencia": "2027-01-01",
  "edadConductor": 30,
  "conTelefono": "0999999999",
  "conCorreo": "juan@correo.com",
  "estadoConductor": "ACT",
  "esEliminado": false,
  "advertencias": [],
  "fechaRegistroUtc": "2026-04-28T00:00:00Z"
}
```

## 14. Clientes

Base: `/api/v1/clientes`

### `GET /`
Hace: lista clientes.

### `GET /consulta`
Hace: búsqueda paginada.

### `GET /{id}`
Hace: detalle de cliente.

### `GET /identificacion/{numero}`
Hace: busca cliente por identificación.

### `POST /`
Hace: crea cliente.

Request:
```json
{
  "cliNombres": "Juan",
  "cliApellidos": "Perez",
  "cliRazonSocial": null,
  "cliTipoIdentificacion": "CED",
  "cliNumeroIdentificacion": "1234567890",
  "cliCorreoElectronico": "juan@correo.com",
  "cliTelefono": "0999999999",
  "cliDireccion": "Quito",
  "cliEsPersonaJuridica": false,
  "cliCreadoPorUsuario": "vendedor1"
}
```

### `PUT /{id}`
Hace: actualiza cliente.

Request:
```json
{
  "idCliente": 20,
  "cliNombres": "Juan",
  "cliApellidos": "Perez",
  "cliRazonSocial": null,
  "cliCorreoElectronico": "juan@correo.com",
  "cliTelefono": "0999999999",
  "cliDireccion": "Quito",
  "cliEstado": "ACT",
  "cliModificadoPorUsuario": "vendedor1",
  "cliModificadoDesde": "web"
}
```

### `POST /buscar`
Hace: búsqueda paginada.

### `POST /{id}/inactivar`
Hace: inactiva cliente.

### `ClienteResponse`
```json
{
  "idCliente": 20,
  "cliGuid": "guid",
  "cliNombres": "Juan",
  "cliApellidos": "Perez",
  "cliRazonSocial": null,
  "cliTipoIdentificacion": "CED",
  "cliNumeroIdentificacion": "1234567890",
  "cliCorreoElectronico": "juan@correo.com",
  "cliTelefono": "0999999999",
  "cliDireccion": "Quito",
  "cliEsPersonaJuridica": false,
  "cliEstado": "ACT",
  "cliEsEliminado": false,
  "advertencias": [],
  "cliFechaRegistroUtc": "2026-04-28T00:00:00Z"
}
```

## 15. Usuarios

Base: `/api/v1/usuarios`

### `GET /`
Hace: lista usuarios.

### `GET /{id}`
Hace: obtiene usuario.

### `POST /`
Hace: crea usuario.

Request:
```json
{
  "username": "operador1",
  "correo": "op@correo.com",
  "password": "123456",
  "creadoPorUsuario": "admin"
}
```

### `PUT /{id}`
Hace: actualiza usuario.

Request:
```json
{
  "idUsuario": 5,
  "correo": "op@correo.com",
  "estadoUsuario": "ACT",
  "activo": true,
  "modificadoPorUsuario": "admin"
}
```

### `POST /buscar`
Hace: búsqueda paginada.

Request:
```json
{
  "username": "operador",
  "correo": null,
  "pageNumber": 1,
  "pageSize": 10
}
```

### `POST /{id}/inactivar`
Hace: inactiva usuario.

### `POST /{id}/activar`
Hace: activa usuario.

### `POST /{id}/cambiar-clave`
Hace: cambia clave.

Request:
```json
{
  "claveActual": "123456",
  "nuevaClave": "654321",
  "modificadoPorUsuario": "admin"
}
```

### `UsuarioResponse`
```json
{
  "idUsuario": 5,
  "usuarioGuid": "guid",
  "username": "operador1",
  "correo": "op@correo.com",
  "estadoUsuario": "ACT",
  "activo": true,
  "fechaRegistroUtc": "2026-04-28T00:00:00Z"
}
```

## 16. Roles

Base: `/api/v1/roles`

### `GET /`
Hace: lista roles.

### `GET /{id}`
Hace: obtiene rol.

### `POST /`
Hace: crea rol.

Request:
```json
{
  "nombreRol": "VENDEDOR",
  "descripcionRol": "Rol comercial",
  "creadoPorUsuario": "admin"
}
```

### `PUT /{id}`
Hace: actualiza rol.

Request:
```json
{
  "idRol": 2,
  "nombreRol": "VENDEDOR",
  "descripcionRol": "Rol comercial",
  "estadoRol": "ACT",
  "activo": true,
  "modificadoPorUsuario": "admin"
}
```

### `POST /{id}/inactivar`
Hace: inactiva rol.

### `RolResponse`
```json
{
  "idRol": 2,
  "rolGuid": "guid",
  "nombreRol": "VENDEDOR",
  "descripcionRol": "Rol comercial",
  "estadoRol": "ACT",
  "activo": true,
  "fechaRegistroUtc": "2026-04-28T00:00:00Z"
}
```

## 17. Usuarios-Roles

Base: `/api/v1/usuarios-roles`

### `POST /asignar`
Hace: asigna rol a usuario.

Request:
```json
{
  "idUsuario": 5,
  "idRol": 2,
  "creadoPorUsuario": "admin"
}
```

### `POST /quitar?idUsuarioRol=10`
Hace: quita rol de usuario.

### `GET /?idUsuario=5`
Hace: lista roles de un usuario.

### `UsuarioRolResponse`
```json
{
  "idUsuarioRol": 10,
  "idUsuario": 5,
  "idRol": 2,
  "nombreRol": "VENDEDOR",
  "estadoUsuarioRol": "ACT",
  "activo": true,
  "fechaRegistroUtc": "2026-04-28T00:00:00Z"
}
```

## 18. Auditoría

Base: `/api/v1/auditorias`

### `GET /`
Hace: lista auditorías.

### `GET /{id}`
Hace: obtiene detalle de auditoría.

### `POST /buscar`
Hace: búsqueda paginada.

Request:
```json
{
  "tablaAfectada": "VEHICULOS",
  "operacion": "UPDATE",
  "usuarioEjecutor": "admin",
  "pageNumber": 1,
  "pageSize": 10
}
```

### `AuditoriaResponse`
```json
{
  "idAuditoria": 1,
  "auditoriaGuid": "guid",
  "tablaAfectada": "VEHICULOS",
  "operacion": "UPDATE",
  "idRegistroAfectado": "1",
  "datosAnteriores": "{...}",
  "datosNuevos": "{...}",
  "usuarioEjecutor": "admin",
  "ipOrigen": "127.0.0.1",
  "fechaEventoUtc": "2026-04-28T00:00:00Z"
}
```
