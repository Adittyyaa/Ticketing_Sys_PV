import { authService  } from '../services/authService.js';
import { logger } from '../middleware/logging.js';
import { validatePasswordStrength, 
  sanitizeUserResponse, 
  getUserInfo 
 } from '../utils/helpers.js';

const login = async (req, res) => {
  const requestId = req.id;

  try {
    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    if (!result) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    logger.info('User login successful', {
      controller: 'auth',
      method: 'login',
      userId: result.user.id,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        token: result.token
      }
    });

  } catch (error) {
    logger.error('Error in login Controller', {
      controller: 'auth',
      method: 'login',
      error: error.message,
      stack: error.stack,
      requestId: requestId,
    });

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const register = async (req, res) => {
  const requestId = req.id;

  try {
    const { email, password, full_name, phone, job_title, company } = req.body;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    const result = await authService.register({
      email,
      password,
      full_name,
      phone,
      job_title,
      company
    });

    logger.info('User registration successful', {
      controller: 'auth',
      method: 'register',
      userId: result.user.id,
      email: result.user.email,
      requestId: requestId,
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: result.user,
        token: result.token
      }
    });

  } catch (error) {
    logger.error('Error in register Controller', {
      controller: 'auth',
      method: 'register',
      error: error.message,
      stack: error.stack,
      requestId: requestId,
    });

    if (error.message === 'User with this email already exists') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const logout = async (req, res) => {
  const requestId = req.id;

  try {
    const { userId } = getUserInfo(req);

    logger.info('User logout successful', {
      controller: 'auth',
      method: 'logout',
      userId: userId,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    logger.error('Error in logout Controller', {
      controller: 'auth',
      method: 'logout',
      error: error.message,
      stack: error.stack,
      requestId: requestId,
    });

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const validateToken = async (req, res) => {
  const requestId = req.id;

  try {
    const user = req.user;

    return res.status(200).json({
      success: true,
      message: 'Token validated successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        }
      }
    });

  } catch (error) {
    logger.error('Error in validateToken Controller', {
      controller: 'auth',
      method: 'validateToken',
      error: error.message,
      stack: error.stack,
      requestId: requestId,
    });

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const changePassword = async (req, res) => {
  const requestId = req.id;

  try {
    const { userId } = getUserInfo(req);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    await authService.changePassword(userId, currentPassword, newPassword);

    logger.info('Password changed successfully', {
      controller: 'auth',
      method: 'changePassword',
      userId: userId,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    logger.error('Error in changePassword Controller', {
      controller: 'auth',
      method: 'changePassword',
      error: error.message,
      stack: error.stack,
      requestId: requestId,
    });

    if (error.message === 'Current password is incorrect') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const requestPasswordReset = async (req, res) => {
  const requestId = req.id;

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const resetToken = await authService.generateResetToken(email);

    // Always return success for security reasons (don't reveal if email exists)
    if (!resetToken) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    }

    logger.info('Password reset token generated', {
      controller: 'auth',
      method: 'requestPasswordReset',
      email: email,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset token generated',
      // TODO: Remove resetToken from response in production - send via email
      resetToken
    });

  } catch (error) {
    logger.error('Error in requestPasswordReset Controller', {
      controller: 'auth',
      method: 'requestPasswordReset',
      error: error.message,
      stack: error.stack,
      requestId: requestId,
    });

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  const requestId = req.id;

  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required'
      });
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    await authService.resetPassword(resetToken, newPassword);

    logger.info('Password reset successful', {
      controller: 'auth',
      method: 'resetPassword',
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    logger.error('Error in resetPassword Controller', {
      controller: 'auth',
      method: 'resetPassword',
      error: error.message,
      stack: error.stack,
      requestId: requestId,
    });

    if (error.message === 'Invalid or expired reset token') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getProfile = async (req, res) => {
  const requestId = req.id;

  try {
    const user = req.user;

    const safeUser = sanitizeUserResponse(user);

    logger.info('Profile retrieved successfully', {
      controller: 'auth',
      method: 'getProfile',
      userId: user.id,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: {
          id: safeUser.id,
          email: safeUser.email,
          full_name: safeUser.full_name,
          role: safeUser.role,
          phone: safeUser.phone,
          job_title: safeUser.job_title,
          company: safeUser.company,
          avatar_url: safeUser.avatar_url,
          created_at: safeUser.created_at,
          updated_at: safeUser.updated_at,
          last_login: safeUser.last_login
        }
      }
    });

  } catch (error) {
    logger.error('Error in getProfile Controller', {
      controller: 'auth',
      method: 'getProfile',
      error: error.message,
      stack: error.stack,
      requestId: requestId,
    });

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  login,
  register,
  logout,
  validateToken,
  changePassword,
  requestPasswordReset,
  resetPassword,
  getProfile,
};