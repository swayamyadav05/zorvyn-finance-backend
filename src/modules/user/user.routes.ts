import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validate.middleware";
import { USER_ROLES } from "../../config/constants";
import * as userController from "./user.controller";
import { createUserSchema, updateUserSchema } from "./user.schema";

const router = Router();
router.use(authenticate, authorize(USER_ROLES.ADMIN));

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List all users
 *     description: Returns a paginated list of all users. Admin only.
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [viewer, analyst, admin] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive] }
 *     responses:
 *       200:
 *         description: Users fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get("/", userController.listUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId of the user
 *     responses:
 *       200:
 *         description: User fetched successfully
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: User not found
 */
router.get("/:id", userController.getUserById);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     description: Admin can create users with any role. Unlike /auth/register, this endpoint allows explicit role assignment.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: New Analyst }
 *               email: { type: string, example: analyst@company.com }
 *               password: { type: string, example: pass123 }
 *               role: { type: string, enum: [viewer, analyst, admin], default: viewer }
 *     responses:
 *       201:
 *         description: User created successfully
 *       409:
 *         description: Email already in use
 */
router.post(
  "/",
  validate(createUserSchema),
  userController.createUser,
);

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update a user's role or status
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role: { type: string, enum: [viewer, analyst, admin] }
 *               status: { type: string, enum: [active, inactive] }
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
router.patch(
  "/:id",
  validate(updateUserSchema),
  userController.updateUser,
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Deactivate a user
 *     description: Sets the user's status to 'inactive'. Does not delete the document — preserves audit trails and avoids orphaned record references.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *       400:
 *         description: Cannot deactivate your own account
 *       404:
 *         description: User not found
 */
router.delete("/:id", userController.deactivateUser);

export default router;
