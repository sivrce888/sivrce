-- Tours on owner-listed (no agent) properties: host is the seller, agent stays NULL.
ALTER TABLE "property_tours" ALTER COLUMN "agent_id" DROP NOT NULL;
