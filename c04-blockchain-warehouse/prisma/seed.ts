import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
 
const prisma = new PrismaClient();
 
async function main() {
  console.log('🌱 Seeding database...');
 
  const warehouses = await Promise.all([
    prisma.warehouse.upsert({
      where: { code: 'AMP-01' },
      update: {},
      create: {
        name: 'Ampara Central Warehouse',
        code: 'AMP-01',
        district: 'Ampara',
        address: 'No. 12, Main Street, Ampara',
        latitude: 7.2963,
        longitude: 81.6723,
        capacityTons: 500,
      },
    }),
    prisma.warehouse.upsert({
      where: { code: 'POL-01' },
      update: {},
      create: {
        name: 'Polonnaruwa North Warehouse',
        code: 'POL-01',
        district: 'Polonnaruwa',
        address: 'Kaduruwela Road, Polonnaruwa',
        latitude: 7.9403,
        longitude: 81.0188,
        capacityTons: 750,
      },
    }),
    prisma.warehouse.upsert({
      where: { code: 'KAN-01' },
      update: {},
      create: {
        name: 'Kandy District Warehouse',
        code: 'KAN-01',
        district: 'Kandy',
        address: 'Peradeniya Road, Kandy',
        latitude: 7.2906,
        longitude: 80.6337,
        capacityTons: 300,
      },
    }),
  ]);
 
  console.log(`✅ Seeded ${warehouses.length} warehouses`);
 
  const rounds = 10;
 
  await prisma.user.upsert({
    where: { email: 'admin@pmb.lk' },
    update: {},
    create: {
      email: 'admin@pmb.lk',
      passwordHash: await bcrypt.hash('Admin@123', rounds),
      fullName: 'PMB System Administrator',
      role: Role.ADMIN,
    },
  });
 
  await prisma.user.upsert({
    where: { email: 'rm.ampara@pmb.lk' },
    update: {},
    create: {
      email: 'rm.ampara@pmb.lk',
      passwordHash: await bcrypt.hash('RM@123456', rounds),
      fullName: 'Suranga Senanayake',
      role: Role.REGIONAL_MANAGER,
    },
  });
 
  await prisma.user.upsert({
    where: { email: 'supervisor.amp01@pmb.lk' },
    update: {},
    create: {
      email: 'supervisor.amp01@pmb.lk',
      passwordHash: await bcrypt.hash('Super@123', rounds),
      fullName: 'Nimal Perera',
      role: Role.WAREHOUSE_SUPERVISOR,
      warehouseId: warehouses[0].id,
    },
  });
 
  await prisma.user.upsert({
    where: { email: 'auditor@pmb.lk' },
    update: {},
    create: {
      email: 'auditor@pmb.lk',
      passwordHash: await bcrypt.hash('Audit@123', rounds),
      fullName: 'Dilrukshi Fernando',
      role: Role.AUDITOR,
    },
  });
 
  console.log('✅ Seeded users:');
  console.log('   ADMIN      → admin@pmb.lk           Password: Admin@123');
  console.log('   RM         → rm.ampara@pmb.lk       Password: RM@123456');
  console.log('   SUPERVISOR → supervisor.amp01@pmb.lk Password: Super@123');
  console.log('   AUDITOR    → auditor@pmb.lk         Password: Audit@123');
  console.log('\n🎉 Seeding complete!');
}
 
main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
