import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { getNutrientHistory } from '../controllers/histController.js';
import trackingModel from '../models/trackingModel.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

jest.mock("../middleware/authMiddleware", () => ({
    authMiddleware: (req, res, next) => {
        req.user =  {
        id: '67bcf8a1d2b0084ae91ea486',
        email: 'test@test.com',
        iat: 1740525928,
        exp: 1740529528
        }; // Mocked user
      next();
    },
}));

const app = express();
app.use(express.json());
app.get('/api/history', authMiddleware, getNutrientHistory);

describe("GET /history", () => {
  let mongoServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
    });

    afterEach(async () => {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            const collection = collections[key];
            await collection.deleteMany({});
        }
    });

    it('should return nutrient history with default monthly aggregation', async () => {
        const res = await request(app).get('/api/history');
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toBe('success');
        expect(res.body.data.trackings).toBeInstanceOf(Array);
    });

    it('should return nutrient history with specified time aggregation', async () => {
        const res = await request(app).get('/api/history').query({ timeAgg: 'week' });
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toBe('success');
        expect(res.body.data.trackings).toBeInstanceOf(Array);
    });

    it('should return nutrient history within specified date range', async () => {
        const res = await request(app).get('/api/history').query({ startDate: '2023-01-01', endDate: '2023-12-31' });
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toBe('success');
        expect(res.body.data.trackings).toBeInstanceOf(Array);
    });

    it('should return 400 if there is an error', async () => {
        jest.spyOn(mongoose.Model, 'aggregate').mockImplementationOnce(() => {
            throw new Error('Test error');
        });
        const res = await request(app).get('/api/history');
        expect(res.statusCode).toEqual(400);
        expect(res.body.status).toBe('fail');
        expect(res.body.message).toBe('Test error');
    });

    it('should return aggregated nutrient history based on inserted mock data', async () => {

        await trackingModel.insertMany([
            {
                userId: new mongoose.Types.ObjectId("67bcf8a1d2b0084ae91ea486"),
                foodName: "banana",
                details: {
                    calories: 60,
                    protein: 2,
                    carbohydrates: 20,
                    fat: 1,
                    fiber: 2
                },
                eatenDate: "2024-12-02",
                quantity: 1,
                servingUnit: "grams",
                eatenWhen: "AM snack"
            },
            {
                userId: new mongoose.Types.ObjectId("67bcf8a1d2b0084ae91ea486"),
                foodName: "apple",
                details: {
                    calories: 50,
                    protein: 1,
                    carbohydrates: 15,
                    fat: 0,
                    fiber: 1
                },
                eatenDate: "2024-12-02",
                quantity: 1,
                servingUnit: "grams",
                eatenWhen: "AM snack"
            }
        ]); 

        const res = await request(app).get('/api/history').query({
            // Add your query parameters here if needed
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toBe('success');
        expect(res.body.data.trackings).toEqual([
            
                {
                    "totalCalories": 110,
                    "totalProtein": 3,
                    "totalFat": 1,
                    "totalFiber": 3,
                    "totalCarbohydrate": 35,
                    "aggTime": "2024-12-01T00:00:00.000Z",
                    "timeAgg": "month"
                },
        ]);
    });

});
