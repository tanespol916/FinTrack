import dotenv from 'dotenv';
dotenv.config();
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding categories...');

  // Clear existing data in correct order (due to foreign key constraints)
  await prisma.transaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.account.deleteMany();
  await prisma.category.deleteMany();
  console.log('🗑️ Cleared all existing data');

  // Income Categories
  const incomeCategories = [
    { name: 'Salary', type: 'income', icon: '💰', color: '#10b981' },
    { name: 'Freelance', type: 'income', icon: '💻', color: '#3b82f6' },
    { name: 'Investment', type: 'income', icon: '📈', color: '#8b5cf6' },
    { name: 'Business', type: 'income', icon: '🏢', color: '#f59e0b' },
    { name: 'Rent Income', type: 'income', icon: '🏠', color: '#06b6d4' },
    { name: 'Gift', type: 'income', icon: '🎁', color: '#ec4899' },
    { name: 'Bonus', type: 'income', icon: '🎯', color: '#84cc16' },
    { name: 'Other Income', type: 'income', icon: '💵', color: '#6b7280' },
  ];

  // Expense Categories
  const expenseCategories = [
    { name: 'Food & Dining', type: 'expense', icon: '🍽️', color: '#ef4444' },
    { name: 'Transportation', type: 'expense', icon: '🚗', color: '#f97316' },
    { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#a855f7' },
    { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#06b6d4' },
    { name: 'Bills & Utilities', type: 'expense', icon: '📱', color: '#3b82f6' },
    { name: 'Healthcare', type: 'expense', icon: '🏥', color: '#10b981' },
    { name: 'Education', type: 'expense', icon: '📚', color: '#f59e0b' },
    { name: 'Travel', type: 'expense', icon: '✈️', color: '#8b5cf6' },
    { name: 'Insurance', type: 'expense', icon: '🛡️', color: '#6b7280' },
    { name: 'Home & Garden', type: 'expense', icon: '🏡', color: '#84cc16' },
    { name: 'Personal Care', type: 'expense', icon: '💇', color: '#ec4899' },
    { name: 'Subscriptions', type: 'expense', icon: '📦', color: '#f97316' },
    { name: 'Pets', type: 'expense', icon: '🐾', color: '#06b6d4' },
    { name: 'Charity', type: 'expense', icon: '❤️', color: '#ef4444' },
    { name: 'Other Expense', type: 'expense', icon: '📝', color: '#6b7280' },
  ];

  // Insert categories
  const allCategories = [...incomeCategories, ...expenseCategories];
  
  const createdCategories = [];
  for (const category of allCategories) {
    const created = await prisma.category.create({
      data: category,
    });
    createdCategories.push(created);
  }

  console.log(`✅ Created ${allCategories.length} categories`);
  
  // Create default accounts for demo user (userId: 1)
  console.log('🌱 Seeding default accounts...');
  
  const defaultAccounts = [
    { name: 'Cash', type: 'cash', balance: 2500 },
    { name: 'Kasikorn Checking', type: 'checking', balance: 35000 },
    { name: 'Bangkok Savings', type: 'savings', balance: 120000 },
    { name: 'Visa Credit Card', type: 'credit', balance: 0 },
    { name: 'SCB Easy App', type: 'digital', balance: 8500 },
    { name: 'Investment Portfolio', type: 'investment', balance: 75000 },
  ];

  const createdAccounts = [];
  for (const account of defaultAccounts) {
    const created = await prisma.account.create({
      data: {
        userId: 1, // Assuming first user has ID 1
        ...account,
      },
    });
    createdAccounts.push(created);
  }

  console.log(`✅ Created ${defaultAccounts.length} default accounts`);

  // Seed sample transactions for demo user
  console.log('🌱 Seeding sample transactions...');
  
  const currentYear = new Date().getFullYear();
  const transactions = [
    // January Income transactions
    {
      accountId: createdAccounts[1].id, // Kasikorn Checking
      categoryId: createdCategories[0].id, // Salary
      amount: 45000,
      description: "Monthly Salary",
      date: new Date(currentYear, 0, 1), // January 1st
    },
    {
      accountId: createdAccounts[1].id, // Kasikorn Checking
      categoryId: createdCategories[1].id, // Freelance
      amount: 8000,
      description: "Web Design Project",
      date: new Date(currentYear, 0, 5), // January 5th
    },
    {
      accountId: createdAccounts[4].id, // SCB Easy App
      categoryId: createdCategories[2].id, // Investment
      amount: 2500,
      description: "Stock Dividend",
      date: new Date(currentYear, 0, 10), // January 10th
    },
    {
      accountId: createdAccounts[0].id, // Cash
      categoryId: createdCategories[5].id, // Gift
      amount: 1000,
      description: "Birthday Gift",
      date: new Date(currentYear, 0, 15), // January 15th
    },

    // January Expense transactions
    {
      accountId: createdAccounts[1].id, // Kasikorn Checking
      categoryId: createdCategories[8].id, // Food & Dining
      amount: 350,
      description: "Lunch with colleagues",
      date: new Date(currentYear, 0, 2), // January 2nd
    },
    {
      accountId: createdAccounts[3].id, // Visa Credit Card
      categoryId: createdCategories[8].id, // Food & Dining
      amount: 1200,
      description: "Grocery shopping",
      date: new Date(currentYear, 0, 3), // January 3rd
    },
    {
      accountId: createdAccounts[1].id, // Kasikorn Checking
      categoryId: createdCategories[9].id, // Transportation
      amount: 150,
      description: "BTS Pass",
      date: new Date(currentYear, 0, 4), // January 4th
    },
    {
      accountId: createdAccounts[3].id, // Visa Credit Card
      categoryId: createdCategories[10].id, // Shopping
      amount: 2500,
      description: "New shoes",
      date: new Date(currentYear, 0, 6), // January 6th
    },
    {
      accountId: createdAccounts[1].id, // Kasikorn Checking
      categoryId: createdCategories[11].id, // Entertainment
      amount: 800,
      description: "Movie tickets",
      date: new Date(currentYear, 0, 8), // January 8th
    },
    {
      accountId: createdAccounts[1].id, // Kasikorn Checking
      categoryId: createdCategories[12].id, // Bills & Utilities
      amount: 2500,
      description: "Electricity bill",
      date: new Date(currentYear, 0, 10), // January 10th
    },
    {
      accountId: createdAccounts[1].id, // Kasikorn Checking
      categoryId: createdCategories[12].id, // Bills & Utilities
      amount: 599,
      description: "Internet bill",
      date: new Date(currentYear, 0, 12), // January 12th
    },
    {
      accountId: createdAccounts[3].id, // Visa Credit Card
      categoryId: createdCategories[13].id, // Healthcare
      amount: 450,
      description: "Doctor visit",
      date: new Date(currentYear, 0, 14), // January 14th
    },
    {
      accountId: createdAccounts[0].id, // Cash
      categoryId: createdCategories[8].id, // Food & Dining
      amount: 180,
      description: "Street food dinner",
      date: new Date(currentYear, 0, 16), // January 16th
    },
    {
      accountId: createdAccounts[3].id, // Visa Credit Card
      categoryId: createdCategories[14].id, // Education
      amount: 1200,
      description: "Online course",
      date: new Date(currentYear, 0, 18), // January 18th
    },
    {
      accountId: createdAccounts[1].id, // Kasikorn Checking
      categoryId: createdCategories[15].id, // Travel
      amount: 3500,
      description: "Flight tickets",
      date: new Date(currentYear, 0, 20), // January 20th
    },
    {
      accountId: createdAccounts[3].id, // Visa Credit Card
      categoryId: createdCategories[16].id, // Insurance
      amount: 1800,
      description: "Health insurance",
      date: new Date(currentYear, 0, 22), // January 22nd
    },
    {
      accountId: createdAccounts[1].id, // Kasikorn Checking
      categoryId: createdCategories[17].id, // Home & Garden
      amount: 650,
      description: "Home supplies",
      date: new Date(currentYear, 0, 24), // January 24th
    },
    {
      accountId: createdAccounts[0].id, // Cash
      categoryId: createdCategories[18].id, // Personal Care
      amount: 200,
      description: "Haircut",
      date: new Date(currentYear, 0, 26), // January 26th
    },
    {
      accountId: createdAccounts[4].id, // SCB Easy App
      categoryId: createdCategories[19].id, // Subscriptions
      amount: 299,
      description: "Netflix subscription",
      date: new Date(currentYear, 0, 28), // January 28th
    },

    // February Income transactions
    {
      accountId: createdAccounts[1].id, // Kasikorn Checking
      categoryId: createdCategories[0].id, // Salary
      amount: 45000,
      description: "Monthly Salary",
      date: new Date(currentYear, 1, 1), // February 1st
    },
    {
      accountId: createdAccounts[1].id, // Kasikorn Checking
      categoryId: createdCategories[1].id, // Freelance
      amount: 12000,
      description: "Mobile App Development",
      date: new Date(currentYear, 1, 8), // February 8th
    },
    {
      accountId: createdAccounts[4].id, // SCB Easy App
      categoryId: createdCategories[2].id, // Investment
      amount: 3200,
      description: "Mutual Fund Dividend",
      date: new Date(currentYear, 1, 15), // February 15th
    },

    // February Expense transactions
    {
      accountId: createdAccounts[1].id, // Kasikorn Checking
      categoryId: createdCategories[8].id, // Food & Dining
      amount: 420,
      description: "Team dinner",
      date: new Date(currentYear, 1, 2), // February 2nd
    },
    {
      accountId: createdAccounts[3].id, // Visa Credit Card
      categoryId: createdCategories[8].id, // Food & Dining
      amount: 2800,
      description: "Restaurant celebration",
      date: new Date(currentYear, 1, 5), // February 5th
    },
    {
      accountId: createdAccounts[1].id, // Kasikorn Checking
      categoryId: createdCategories[9].id, // Transportation
      amount: 200,
      description: "Gas refill",
      date: new Date(currentYear, 1, 3), // February 3rd
    },
    {
      accountId: createdAccounts[3].id, // Visa Credit Card
      categoryId: createdCategories[10].id, // Shopping
      amount: 1800,
      description: "Winter clothes",
      date: new Date(currentYear, 1, 7), // February 7th
    },
    {
      accountId: createdAccounts[1].id, // Kasikorn Checking
      categoryId: createdCategories[11].id, // Entertainment
      amount: 1500,
      description: "Concert tickets",
      date: new Date(currentYear, 1, 10), // February 10th
    },
    {
      accountId: createdAccounts[1].id, // Kasikorn Checking
      categoryId: createdCategories[12].id, // Bills & Utilities
      amount: 2800,
      description: "Water bill",
      date: new Date(currentYear, 1, 12), // February 12th
    },
    {
      accountId: createdAccounts[1].id, // Kasikorn Checking
      categoryId: createdCategories[12].id, // Bills & Utilities
      amount: 599,
      description: "Internet bill",
      date: new Date(currentYear, 1, 12), // February 12th
    },
    {
      accountId: createdAccounts[3].id, // Visa Credit Card
      categoryId: createdCategories[13].id, // Healthcare
      amount: 800,
      description: "Dental checkup",
      date: new Date(currentYear, 1, 14), // February 14th
    },
    {
      accountId: createdAccounts[0].id, // Cash
      categoryId: createdCategories[8].id, // Food & Dining
      amount: 250,
      description: "Coffee shop",
      date: new Date(currentYear, 1, 16), // February 16th
    },
    {
      accountId: createdAccounts[3].id, // Visa Credit Card
      categoryId: createdCategories[10].id, // Shopping
      amount: 3500,
      description: "New phone case",
      date: new Date(currentYear, 1, 18), // February 18th
    },
    {
      accountId: createdAccounts[1].id, // Kasikorn Checking
      categoryId: createdCategories[17].id, // Home & Garden
      amount: 1200,
      description: "Garden supplies",
      date: new Date(currentYear, 1, 20), // February 20th
    },
    {
      accountId: createdAccounts[0].id, // Cash
      categoryId: createdCategories[18].id, // Personal Care
      amount: 300,
      description: "Spa treatment",
      date: new Date(currentYear, 1, 22), // February 22nd
    },
    {
      accountId: createdAccounts[4].id, // SCB Easy App
      categoryId: createdCategories[19].id, // Subscriptions
      amount: 299,
      description: "Spotify subscription",
      date: new Date(currentYear, 1, 25), // February 25th
    },
  ];

  for (const tx of transactions) {
    await prisma.transaction.create({
      data: {
        userId: 1,
        ...tx,
        date: tx.date.toISOString(),
      },
    });
  }

  console.log(`✅ Created ${transactions.length} sample transactions`);

  // Seed sample budgets
  console.log('🌱 Seeding sample budgets...');
  
  const budgets = [
    // January budgets
    {
      categoryId: createdCategories[8].id, // Food & Dining
      amount: 8000,
      month: 1, // January
      year: currentYear,
    },
    {
      categoryId: createdCategories[9].id, // Transportation
      amount: 2000,
      month: 1, // January
      year: currentYear,
    },
    {
      categoryId: createdCategories[10].id, // Shopping
      amount: 5000,
      month: 1, // January
      year: currentYear,
    },
    {
      categoryId: createdCategories[11].id, // Entertainment
      amount: 3000,
      month: 1, // January
      year: currentYear,
    },
    {
      categoryId: createdCategories[12].id, // Bills & Utilities
      amount: 5000,
      month: 1, // January
      year: currentYear,
    },
    // February budgets
    {
      categoryId: createdCategories[8].id, // Food & Dining
      amount: 9000,
      month: 2, // February
      year: currentYear,
    },
    {
      categoryId: createdCategories[9].id, // Transportation
      amount: 2500,
      month: 2, // February
      year: currentYear,
    },
    {
      categoryId: createdCategories[10].id, // Shopping
      amount: 6000,
      month: 2, // February
      year: currentYear,
    },
    {
      categoryId: createdCategories[11].id, // Entertainment
      amount: 4000,
      month: 2, // February
      year: currentYear,
    },
    {
      categoryId: createdCategories[12].id, // Bills & Utilities
      amount: 5500,
      month: 2, // February
      year: currentYear,
    },
  ];

  for (const budget of budgets) {
    await prisma.budget.create({
      data: {
        userId: 1,
        ...budget,
      },
    });
  }

  console.log(`✅ Created ${budgets.length} sample budgets`);

  // Seed sample goals
  console.log('🌱 Seeding sample goals...');
  
  const goals = [
    {
      title: "Emergency Fund",
      targetAmount: 100000,
      currentAmount: 45000,
      deadline: new Date(currentYear + 1, 0, 31), // January 31 next year
    },
    {
      title: "New Laptop",
      targetAmount: 35000,
      currentAmount: 12000,
      deadline: new Date(currentYear, 3, 30), // April 30 this year
    },
    {
      title: "Vacation Fund",
      targetAmount: 50000,
      currentAmount: 15000,
      deadline: new Date(currentYear, 6, 31), // July 31 this year
    },
    {
      title: "Investment Portfolio",
      targetAmount: 200000,
      currentAmount: 75000,
      deadline: new Date(currentYear + 2, 0, 31), // January 31 two years from now
    },
  ];

  for (const goal of goals) {
    await prisma.goal.create({
      data: {
        userId: 1,
        ...goal,
        deadline: goal.deadline.toISOString(),
      },
    });
  }

  console.log(`✅ Created ${goals.length} sample goals`);
  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
