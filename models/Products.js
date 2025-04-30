const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Products = sequelize.define(
  "Products",
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
      validate: {
        isUrl: true, // Проверка на валидный URL (если есть)
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    short: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    photo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    profit: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    margin: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    views: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    subs: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    favorites_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    views_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    business_type: {
      type: DataTypes.ENUM(
        "E-commerce",
        "SaaS",
        "агенство",
        "mobile",
        "физический бизнес" // Добавлено для соответствия вариантам
      ),
      allowNull: true,
    },
    monetization_model: {
      type: DataTypes.TEXT, // Или DataTypes.STRING, если ограничена длина
      allowNull: true,
      get() {
        const rawValue = this.getDataValue("monetization_model");
        try {
          return JSON.parse(rawValue); // Преобразуем строку JSON в массив
        } catch (e) {
          return []; // Возвращаем пустой массив, если не JSON
        }
      },
      set(value) {
        this.setDataValue("monetization_model", JSON.stringify(value)); // Преобразуем массив в строку JSON
      },
    },
    founded_date: {
      // Изменено имя поля для соответствия snake_case
      type: DataTypes.STRING, //  Храним только дату (год и месяц)
      allowNull: true,
    },
    location_country: {
      // Изменено имя поля для соответствия snake_case
      type: DataTypes.STRING,
    },
    location_city: {
      // Изменено имя поля для соответствия snake_case
      type: DataTypes.STRING,
    },
    reason_for_selling: {
      // Изменено имя поля для соответствия snake_case
      type: DataTypes.STRING,
      allowNull: true,
    },
    assets_included: {
      // Изменено имя поля для соответствия snake_case
      type: DataTypes.TEXT, // Можно хранить как JSON строку, если нужно больше структуры
      get() {
        const rawValue = this.getDataValue("assets_included");
        try {
          return JSON.parse(rawValue); // Преобразуем строку JSON в массив
        } catch (e) {
          return rawValue; // Возвращаем как есть, если не JSON
        }
      },
      set(value) {
        this.setDataValue("assets_included", JSON.stringify(value)); // Преобразуем массив в строку JSON
      },
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gross_revenue_last_12_months: {
      type: DataTypes.DECIMAL(15, 2), // Достаточно большая точность для денежных сумм
      allowNull: true,
    },
    net_profit_last_12_months: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    average_monthly_revenue: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    average_monthly_profit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },

    management_time_weekly: {
      type: DataTypes.INTEGER, // В часах
      allowNull: true,
    },
    required_skills: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    has_employees: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    employee_count: {
      type: DataTypes.INTEGER,
    },
    employee_responsibilities: {
      type: DataTypes.TEXT,
    },
    used_tools: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    key_suppliers: {
      type: DataTypes.TEXT,
    },
    transfer_process: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    traffic_sources: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    social_media_accounts: {
      type: DataTypes.TEXT, // Хранить как JSON
      get() {
        const rawValue = this.getDataValue("social_media_accounts");
        try {
          return JSON.parse(rawValue);
        } catch (e) {
          return rawValue;
        }
      },
      set(value) {
        this.setDataValue("social_media_accounts", JSON.stringify(value));
      },
    },
    email_list_size: {
      type: DataTypes.INTEGER,
    },
    marketing_strategies: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    has_registered_company: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    company_jurisdiction: {
      type: DataTypes.STRING,
    },
    has_trademarks: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    has_patents: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    has_legal_issues: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    legal_issues_details: {
      type: DataTypes.TEXT,
    },
    asking_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    negotiable: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    terms_of_sale: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    training_provided: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    training_duration: {
      type: DataTypes.STRING,
    },
    photos_videos: {
      type: DataTypes.TEXT, // Хранить как JSON
      get() {
        const rawValue = this.getDataValue("photos_videos");
        try {
          return JSON.parse(rawValue);
        } catch (e) {
          return rawValue;
        }
      },
      set(value) {
        this.setDataValue("photos_videos", JSON.stringify(value));
      },
    },
    presentation_url: {
      type: DataTypes.STRING,
      validate: {
        isUrl: true,
      },
    },
  },
  { timestamps: true }
);

module.exports = Products;
/**/
