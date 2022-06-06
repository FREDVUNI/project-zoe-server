import { Module, Scope, Global, BadRequestException } from "@nestjs/common";
import { getConnectionManager, createConnection } from "typeorm";
import { REQUEST } from "@nestjs/core";
import config, { appEntities } from "../config";
import { TenantsController } from "./tenants.controller";
import { TenantsService } from "./tenants.service";
import * as dotenv from "dotenv";
import { DbService } from "src/shared/db.service";
import { SeedModule } from "src/seed/seed.module";
import { Tenant } from "./entities/tenant.entity";
const connectionFactory = {
  provide: "CONNECTION",
  scope: Scope.REQUEST,
  useFactory: async (req) => {
    const tenantName = req.headers["tenant"];
    const connectionManager = getConnectionManager();
    const connectionPublic = connectionManager.get("default");
    const allTenants = ["demo", "worshipharvest", "vive"];

    //const tenantDetails = await connectionPublic.getRepository(Tenant).findOne({code: tenantName})

    if (!tenantName) {
      throw new BadRequestException(
        "No church name provided. A valid church name must be provided.",
      );
    }
    if (!allTenants.includes(tenantName)) {
      throw new BadRequestException("Invalid church name provided.");
    }

    //const tenancy = tenantDetails.code

    const connectionName = `${process.env.DB_DATABASE}_${tenantName}`;
    if (connectionManager.has(connectionName)) {
      const connection = await connectionManager.get(connectionName);
      return Promise.resolve(
        connection.isConnected ? connection : connection.connect(),
      );
    } else {
      const dbEntities = tenantName == "public" ? [Tenant] : appEntities;
      await createConnection({
        ...config.database,
        name: connectionName,
        type: "postgres",
        entities: dbEntities,
        schema: tenantName,
      });

      const connection = await connectionManager.get(connectionName);
      return Promise.resolve(
        connection.isConnected ? connection : connection.connect(),
      );
    }
  },
  inject: [REQUEST],
};

@Global()
@Module({
  imports: [SeedModule],
  providers: [connectionFactory, TenantsService, DbService],
  exports: ["CONNECTION"],
  controllers: [TenantsController],
})
export class TenantsModule {}