CREATE TABLE cliente (
  idusuario varchar(255) NOT NULL, 
  nombre    varchar(255) NOT NULL, 
  telefono  varchar(255) NOT NULL, 
  PRIMARY KEY (idusuario));
CREATE TABLE cliente_manicure (
  manicureidusuario varchar(255) NOT NULL, 
  clienteidusuario  varchar(255) NOT NULL, 
  PRIMARY KEY (manicureidusuario, 
  clienteidusuario));
CREATE TABLE disenno (
  id                SERIAL NOT NULL, 
  url               varchar(255) NOT NULL, 
  manicureidusuario varchar(255) NOT NULL, 
  PRIMARY KEY (id));
CREATE TABLE horario (
  id                SERIAL NOT NULL, 
  horaInicio        time(7) NOT NULL, 
  horaFinal         time(7) NOT NULL, 
  manicureidusuario varchar(255) NOT NULL, 
  PRIMARY KEY (id));
CREATE TABLE manicure (
  idusuario varchar(255) NOT NULL, 
  nombre    varchar(255) NOT NULL, 
  foto      varchar(255), 
  direccion varchar(255) NOT NULL, 
  provincia varchar(255) NOT NULL, 
  municipio varchar(255) NOT NULL, 
  telefono  varchar(255) NOT NULL, 
  PRIMARY KEY (idusuario));
CREATE TABLE notificacion (
  id                SERIAL NOT NULL, 
  mensaje           varchar(500) NOT NULL, 
  reservacionid     int4 NOT NULL, 
  leido             bool DEFAULT 'False' NOT NULL, 
  manicureidusuario varchar(255) NOT NULL, 
  clienteidusuario  varchar(255) NOT NULL, 
  PRIMARY KEY (id));
CREATE TABLE reservacion (
  id               SERIAL NOT NULL, 
  disenno          varchar(255), 
  tamanno          varchar(255), 
  precio           float8 NOT NULL, 
  fecha            date NOT NULL, 
  estado           varchar(255) NOT NULL, 
  horarioid        int4 NOT NULL, 
  clienteidusuario varchar(255) NOT NULL, 
  servicioid       int4 NOT NULL, 
  PRIMARY KEY (id));
CREATE TABLE servicio (
  id                SERIAL NOT NULL, 
  nombre            varchar(255) NOT NULL, 
  disponible        bool DEFAULT 'true' NOT NULL, 
  manicureidusuario varchar(255) NOT NULL, 
  PRIMARY KEY (id));
CREATE TABLE usuario (
  usuario    varchar(255) NOT NULL, 
  nombre     varchar(255) NOT NULL, 
  contrasena varchar(255) NOT NULL, 
  rol        varchar(255) NOT NULL, 
  PRIMARY KEY (usuario));
ALTER TABLE cliente_manicure ADD CONSTRAINT FKcliente_ma374118 FOREIGN KEY (manicureidusuario) REFERENCES manicure (idusuario);
ALTER TABLE servicio ADD CONSTRAINT FKservicio279597 FOREIGN KEY (manicureidusuario) REFERENCES manicure (idusuario);
ALTER TABLE reservacion ADD CONSTRAINT FKreservacio6230 FOREIGN KEY (servicioid) REFERENCES servicio (id);
ALTER TABLE disenno ADD CONSTRAINT FKdisenno49959 FOREIGN KEY (manicureidusuario) REFERENCES manicure (idusuario);
ALTER TABLE reservacion ADD CONSTRAINT contiene FOREIGN KEY (horarioid) REFERENCES horario (id);
ALTER TABLE horario ADD CONSTRAINT crea FOREIGN KEY (manicureidusuario) REFERENCES manicure (idusuario);
ALTER TABLE notificacion ADD CONSTRAINT envia FOREIGN KEY (reservacionid) REFERENCES reservacion (id);
ALTER TABLE cliente ADD CONSTRAINT es FOREIGN KEY (idusuario) REFERENCES usuario (usuario);
ALTER TABLE manicure ADD CONSTRAINT "puede ser" FOREIGN KEY (idusuario) REFERENCES usuario (usuario);
ALTER TABLE reservacion ADD CONSTRAINT realiza FOREIGN KEY (clienteidusuario) REFERENCES cliente (idusuario);
ALTER TABLE notificacion ADD CONSTRAINT recibe FOREIGN KEY (manicureidusuario) REFERENCES manicure (idusuario);
ALTER TABLE notificacion ADD CONSTRAINT recibe1 FOREIGN KEY (clienteidusuario) REFERENCES cliente (idusuario);
ALTER TABLE cliente_manicure ADD CONSTRAINT tiene FOREIGN KEY (clienteidusuario) REFERENCES cliente (idusuario);
