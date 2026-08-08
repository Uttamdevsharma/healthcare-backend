import app from "./app";
import { envVars } from "./app/config/env";
import { redisService } from "./app/lib/redis";
import { seedSuperAdmin } from "./app/utils/seed";

const bootstrap = async() => {
    try {
        await seedSuperAdmin();
        await redisService.connect().catch(console.error);
        app.listen(envVars.PORT, () => {
            console.log(`Server is running on http://localhost:${envVars.PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
    }
}

bootstrap();