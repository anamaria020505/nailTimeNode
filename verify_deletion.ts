
import database from "./config/database";
import modelos from "./models/index"; // Import to initialize associations
const { Usuario, Manicure, Servicio, Reservacion, Horario, Cliente, Notificacion } = modelos;
import { eliminarUsuario } from "./controllers/usuario";

const verifyDeletion = async () => {
    try {
        await database.authenticate();
        console.log("Database connected.");

        // 1. Create dummy data
        const timestamp = Date.now();
        const username = `test_manicure_${timestamp}`;
        const clientUsername = `test_client_${timestamp}`;

        // Create Manicure User
        await Usuario.create({
            usuario: username,
            nombre: "Test Manicure",
            contrasena: "password123",
            rol: "manicure"
        });

        await Manicure.create({
            idusuario: username,
            direccion: "Test Address",
            provincia: "Test Province",
            municipio: "Test Municipality",
            telefono: "1234567890"
        });

        // Create Client User
        await Usuario.create({
            usuario: clientUsername,
            nombre: "Test Client",
            contrasena: "password123",
            rol: "cliente"
        });

        await Cliente.create({
            idusuario: clientUsername,
            telefono: "0987654321"
        });

        // Create Service
        const service = await Servicio.create({
            nombre: "Test Service",
            disponible: true,
            manicureidusuario: username
        });

        // Create Schedule (needed for reservation)
        const horario = await Horario.create({
            horaInicio: "09:00",
            horaFinal: "10:00",
            manicureidusuario: username
        });

        // Create Reservation
        const reservation = await Reservacion.create({
            precio: 100,
            fecha: new Date(),
            estado: "pendiente",
            horarioid: horario.id,
            clienteidusuario: clientUsername,
            servicioid: service.id
        });

        console.log(`Created test data. Manicure: ${username}, Reservation: ${reservation.id}`);

        // 2. Execute deletion
        console.log("Executing eliminarUsuario...");
        await eliminarUsuario(username);

        // 3. Verify results
        const updatedUser = await Usuario.findByPk(username);
        const updatedManicure = await Manicure.findByPk(username);
        const updatedReservation = await Reservacion.findByPk(reservation.id);
        const notification = await Notificacion.findOne({
            where: { reservacionid: reservation.id }
        });

        console.log("Verification Results:");
        console.log("User Name:", updatedUser?.nombre); // Should be "Usuario Eliminado"
        console.log("User Role:", updatedUser?.rol); // Should be "eliminado"
        console.log("Manicure Address:", updatedManicure?.direccion); // Should be "Dirección eliminada"
        console.log("Reservation Status:", updatedReservation?.estado); // Should be "cancelada"
        console.log("Cancellation Reason:", updatedReservation?.motivoCancelacion); // Should be "La manicure ha eliminado su perfil"
        console.log("Notification Message:", notification?.mensaje); // Should exist and contain message

        if (
            updatedUser?.nombre === "Usuario Eliminado" &&
            updatedUser?.rol === "eliminado" &&
            updatedReservation?.estado === "cancelada" &&
            updatedReservation?.motivoCancelacion === "La manicure ha eliminado su perfil" &&
            notification
        ) {
            console.log("SUCCESS: Manicure anonymized, reservation cancelled with reason, and notification sent.");
        } else {
            console.error("FAILURE: Verification failed.");
        }

    } catch (error) {
        console.error("Error during verification:", error);
    } finally {
        // await database.close();
    }
};

verifyDeletion();
