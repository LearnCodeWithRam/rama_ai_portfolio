import { PortfolioConfig } from '../types/portfolio';
import ConfigParser from './config-parser';
import portfolioConfigJson from '../../portfolio-config.json';

// Import the configuration file - using dynamic import for better compatibility
let portfolioConfig: PortfolioConfig;

const normalizeConfig = (config: PortfolioConfig & {
  achievements?: Array<{ title: string; description: string }>;
  availability?: {
    status?: string;
    focusAreas?: string[];
    workStyle?: string;
  };
}): PortfolioConfig => {
  const rawSkills = config.skills as PortfolioConfig['skills'] & {
    programming_databases?: string[];
    machine_learning_deep_learning?: string[];
    genai_agentic_ai?: string[];
    cloud_mlops?: string[];
    computer_vision_nlp?: string[];
    data_analysis_visualization?: string[];
  };

  return {
    ...config,
    personal: {
      ...config.personal,
      handle: config.personal.handle || `@${config.personal.name.toLowerCase().replace(/\s+/g, '')}`
    },
    education: {
      ...config.education,
      current: {
        ...config.education.current,
        cgpa: config.education.current.cgpa || 'Not specified',
        graduationDate: config.education.current.graduationDate || config.education.current.duration
      },
      achievements: config.education.achievements || config.achievements?.map(achievement =>
        `${achievement.title}: ${achievement.description}`
      ) || []
    },
    skills: {
      programming: rawSkills.programming || rawSkills.programming_databases || [],
      ml_ai: rawSkills.ml_ai || [
        ...(rawSkills.machine_learning_deep_learning || []),
        ...(rawSkills.genai_agentic_ai || [])
      ],
      web_development: rawSkills.web_development || [],
      databases: rawSkills.databases || rawSkills.programming_databases || [],
      devops_cloud: rawSkills.devops_cloud || rawSkills.cloud_mlops || [],
      iot_hardware: rawSkills.iot_hardware || [],
      soft_skills: rawSkills.soft_skills || []
    },
    internship: config.internship || {
      seeking: Boolean(config.availability),
      duration: 'Flexible',
      startDate: 'Immediately',
      preferredLocation: 'Flexible',
      focusAreas: config.availability?.focusAreas || [],
      availability: config.availability?.status || '',
      workStyle: config.availability?.workStyle || '',
      goals: ''
    },
    personality: config.personality || {
      traits: [],
      interests: [],
      funFacts: [],
      workingStyle: config.availability?.workStyle || '',
      motivation: ''
    },
    resume: {
      ...config.resume,
      fileSize: config.resume.fileSize || ''
    },
    projects: config.projects.map(project => ({
      ...project,
      date: project.date || '',
      status: project.status || 'Completed'
    }))
  };
};

try {
  // Import JSON configuration
  portfolioConfig = normalizeConfig(portfolioConfigJson as unknown as PortfolioConfig & {
    achievements?: Array<{ title: string; description: string }>;
    availability?: {
      status?: string;
      focusAreas?: string[];
      workStyle?: string;
    };
  });
} catch (error) {
  console.error('Failed to load portfolio configuration:', error);
  // Provide a fallback minimal config to prevent the app from crashing
  portfolioConfig = {
    personal: {
      name: 'Configuration Error',
      age: 0,
      location: 'Unknown',
      title: 'Error Loading Config',
      email: 'error@example.com',
      handle: '@error',
      bio: 'Configuration file could not be loaded',
      avatar: '/placeholder.jpg',
      fallbackAvatar: '/placeholder.jpg'
    },
    education: {
      current: {
        degree: 'Error',
        institution: 'Error',
        duration: 'Error',
        cgpa: 'Error',
        graduationDate: 'Error'
      },
      achievements: []
    },
    experience: [],
    skills: {
      programming: [],
      ml_ai: [],
      web_development: [],
      databases: [],
      devops_cloud: [],
      iot_hardware: [],
      soft_skills: []
    },
    projects: [],
    social: {
      linkedin: '',
      github: '',
      twitter: '',
      kaggle: '',
      leetcode: '',
      fiverr: ''
    },
    internship: {
      seeking: false,
      duration: '',
      startDate: '',
      preferredLocation: '',
      focusAreas: [],
      availability: '',
      workStyle: '',
      goals: ''
    },
    personality: {
      traits: [],
      interests: [],
      funFacts: [],
      workingStyle: '',
      motivation: ''
    },
    resume: {
      title: '',
      description: '',
      fileType: '',
      lastUpdated: '',
      fileSize: '',
      downloadUrl: ''
    },
    chatbot: {
      name: '',
      personality: '',
      tone: '',
      language: '',
      responseStyle: '',
      useEmojis: false,
      topics: []
    },
    presetQuestions: {
      me: [],
      professional: [],
      projects: [],
      contact: [],
      fun: []
    },
    meta: {
      configVersion: '',
      lastUpdated: '',
      generatedBy: '',
      description: ''
    }
  } as PortfolioConfig;
}

// Create a parser instance
const configParser = new ConfigParser(portfolioConfig);

// Export configuration and parsed data
export const getConfig = (): PortfolioConfig => portfolioConfig;
export const getConfigParser = (): ConfigParser => configParser;

// Export pre-parsed common data for easy access
export const systemPrompt = configParser.generateSystemPrompt();
export const contactInfo = configParser.generateContactInfo();
export const profileInfo = configParser.generateProfileInfo();
export const skillsData = configParser.generateSkillsData();
export const projectData = configParser.generateProjectData();
export const presetReplies = configParser.generatePresetReplies();
export const resumeDetails = configParser.generateResumeDetails();
export const internshipInfo = configParser.generateInternshipInfo();
