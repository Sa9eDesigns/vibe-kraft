import { PrismaClient, UserRole, MemberRole, TaskStatus, TaskPriority, WorkspaceStatus, WebVMStatus, MetricType } from '../lib/generated/prisma';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Helper function to generate random date within a range
function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper function to pick a random item from an array
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to generate a random number within a range
function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to generate realistic task titles
function generateTaskTitle(projectType: string): string {
  const developmentTasks = [
    "Implement user authentication",
    "Create responsive dashboard layout",
    "Fix navigation bug in mobile view",
    "Optimize database queries",
    "Add dark mode support",
    "Implement file upload functionality",
    "Create API documentation",
    "Set up CI/CD pipeline",
    "Implement real-time notifications",
    "Add export to PDF feature",
    "Create user onboarding flow",
    "Implement search functionality",
    "Add data visualization charts",
    "Implement multi-language support",
    "Create admin dashboard",
    "Implement payment gateway integration",
    "Add email notification system",
    "Create user profile page",
    "Implement role-based access control",
    "Add analytics tracking"
  ];

  const designTasks = [
    "Design landing page mockup",
    "Create logo variations",
    "Design mobile app UI kit",
    "Create brand style guide",
    "Design email newsletter template",
    "Create social media graphics",
    "Design product packaging",
    "Create promotional banners",
    "Design user onboarding screens",
    "Create iconography set",
    "Design dashboard UI",
    "Create marketing materials",
    "Design business cards",
    "Create website wireframes",
    "Design app store assets",
    "Create presentation template",
    "Design product catalog",
    "Create infographics",
    "Design user personas",
    "Create motion graphics"
  ];

  const marketingTasks = [
    "Create content calendar",
    "Write blog post on industry trends",
    "Set up social media campaigns",
    "Analyze competitor strategies",
    "Create email marketing sequence",
    "Develop SEO strategy",
    "Create PPC campaign",
    "Conduct market research",
    "Create case studies",
    "Develop influencer outreach plan",
    "Create product launch strategy",
    "Write press release",
    "Create customer testimonials",
    "Develop affiliate marketing program",
    "Create lead generation campaign",
    "Analyze marketing metrics",
    "Create promotional video",
    "Develop content strategy",
    "Create social media guidelines",
    "Plan webinar content"
  ];

  if (projectType.toLowerCase().includes('design') || projectType.toLowerCase().includes('creative')) {
    return randomItem(designTasks);
  } else if (projectType.toLowerCase().includes('marketing') || projectType.toLowerCase().includes('promotion')) {
    return randomItem(marketingTasks);
  } else {
    return randomItem(developmentTasks);
  }
}

// Helper function to generate realistic task descriptions
function generateTaskDescription(title: string, priority: TaskPriority): string {
  const priorityText = priority === TaskPriority.HIGH 
    ? "This is a high priority task that requires immediate attention." 
    : priority === TaskPriority.MEDIUM 
      ? "This task has medium priority and should be completed within the sprint." 
      : "This is a low priority task that can be addressed when time permits.";
  
  const developmentDescriptions = [
    `${title} according to the requirements document. ${priorityText} Make sure to follow the coding standards and write unit tests.`,
    `${title} with proper error handling and validation. ${priorityText} This feature is requested by multiple clients.`,
    `${title} using the latest best practices. ${priorityText} Ensure backward compatibility with existing systems.`,
    `${title} and ensure it's responsive on all device sizes. ${priorityText} This feature will be showcased in the next demo.`,
    `${title} with comprehensive documentation. ${priorityText} This is a core functionality that will be used by other teams.`
  ];

  const designDescriptions = [
    `${title} following our brand guidelines. ${priorityText} The design should be modern and appeal to our target audience.`,
    `${title} with multiple variations for review. ${priorityText} This will be used in our upcoming marketing campaign.`,
    `${title} that aligns with our product vision. ${priorityText} Consider accessibility guidelines during the design process.`,
    `${title} with attention to detail and user experience. ${priorityText} This design will be implemented in the next release.`,
    `${title} that communicates our brand values. ${priorityText} The final deliverable should include source files and assets.`
  ];

  const marketingDescriptions = [
    `${title} targeting our key demographics. ${priorityText} This campaign should align with our Q3 objectives.`,
    `${title} to increase brand awareness. ${priorityText} Include metrics for measuring success and ROI.`,
    `${title} with compelling copy and visuals. ${priorityText} This content will be distributed across multiple channels.`,
    `${title} based on customer insights. ${priorityText} The strategy should address pain points identified in recent surveys.`,
    `${title} to drive conversion and engagement. ${priorityText} Coordinate with the sales team for alignment.`
  ];

  if (title.toLowerCase().includes('design') || title.toLowerCase().includes('create') || title.toLowerCase().includes('mockup')) {
    return randomItem(designDescriptions);
  } else if (title.toLowerCase().includes('marketing') || title.toLowerCase().includes('campaign') || title.toLowerCase().includes('content')) {
    return randomItem(marketingDescriptions);
  } else {
    return randomItem(developmentDescriptions);
  }
}

// Helper function to generate realistic project descriptions
function generateProjectDescription(name: string, orgName: string): string {
  const descriptions = [
    `${name} is a strategic initiative for ${orgName} aimed at improving customer experience through innovative technology solutions.`,
    `${name} focuses on developing a scalable platform that will enable ${orgName} to expand into new markets and reach a broader audience.`,
    `${name} is designed to streamline internal processes at ${orgName}, reducing operational costs and improving efficiency across departments.`,
    `${name} represents ${orgName}'s commitment to digital transformation, leveraging cutting-edge technologies to stay ahead of the competition.`,
    `${name} is a collaborative effort between multiple teams at ${orgName} to create a comprehensive solution that addresses key business challenges.`,
    `${name} aims to revolutionize how ${orgName} interacts with its customers by implementing personalized experiences powered by data analytics.`,
    `${name} is part of ${orgName}'s long-term strategy to build sustainable growth through technological innovation and process optimization.`,
    `${name} focuses on creating a robust infrastructure that will support ${orgName}'s future growth and evolving business needs.`,
    `${name} is designed to enhance ${orgName}'s brand presence through creative digital solutions and engaging user experiences.`,
    `${name} represents a significant investment by ${orgName} in modernizing its technology stack and adopting cloud-native architectures.`
  ];

  return randomItem(descriptions);
}

// Helper function to generate realistic organization data
function generateOrganizationData(name: string): { description: string, industry: string, size: string, website: string } {
  const industries = [
    "Technology", "Healthcare", "Finance", "Education", "Manufacturing", 
    "Retail", "Media", "Consulting", "Real Estate", "Energy"
  ];
  
  const sizes = ["Small (1-50)", "Medium (51-200)", "Large (201-1000)", "Enterprise (1000+)"];
  
  const industry = randomItem(industries);
  const size = randomItem(sizes);
  const website = `https://www.${name.toLowerCase().replace(/\s+/g, '')}.com`;
  
  const descriptions = [
    `${name} is a leading ${industry.toLowerCase()} company focused on innovation and customer satisfaction.`,
    `${name} provides cutting-edge solutions in the ${industry.toLowerCase()} sector with a team of dedicated professionals.`,
    `${name} has been transforming the ${industry.toLowerCase()} landscape since its founding, with a commitment to excellence.`,
    `${name} combines industry expertise with technological innovation to deliver superior ${industry.toLowerCase()} services.`,
    `${name} is a ${size.toLowerCase()} ${industry.toLowerCase()} organization dedicated to solving complex challenges through collaboration.`
  ];
  
  return {
    description: randomItem(descriptions),
    industry,
    size,
    website
  };
}

// Helper function to generate realistic workspace configurations
function generateWorkspaceConfig(projectName: string, isActive: boolean): any {
  const themes = ["dark", "light", "system"];
  const fontSizes = [12, 14, 16, 18];
  const editorTypes = ["monaco", "codemirror", "simple"];
  
  const baseConfig = {
    theme: randomItem(themes),
    autoSave: Math.random() > 0.3,
    fontSize: randomItem(fontSizes),
    editorType: randomItem(editorTypes),
    showLineNumbers: Math.random() > 0.2,
    tabSize: randomItem([2, 4]),
    wordWrap: Math.random() > 0.5,
    formatOnSave: Math.random() > 0.4,
    livePreview: Math.random() > 0.5,
  };
  
  // Add more configuration for active workspaces
  if (isActive) {
    return {
      ...baseConfig,
      extensions: [
        "eslint",
        "prettier",
        "git-integration",
        "intellisense",
        "debugger"
      ],
      terminal: {
        fontFamily: "Menlo, Monaco, 'Courier New', monospace",
        fontSize: randomItem([12, 14, 16]),
        lineHeight: 1.5,
        cursorStyle: randomItem(["block", "line", "underline"]),
        cursorBlink: true
      },
      git: {
        enabled: true,
        autoFetch: Math.random() > 0.5,
        autoPush: Math.random() > 0.7
      },
      projectSpecific: {
        name: projectName,
        buildCommand: "npm run build",
        startCommand: "npm start",
        testCommand: "npm test"
      }
    };
  }
  
  return baseConfig;
}

// Helper function to generate realistic VM configurations
function generateVMConfig(): any {
  const cpuCores = randomItem([1, 2, 4, 8]);
  const memoryOptions = [2048, 4096, 8192, 16384];
  const diskOptions = [5, 10, 20, 50, 100];
  
  return {
    cpuCores,
    memoryMB: randomItem(memoryOptions),
    diskGB: randomItem(diskOptions),
    osType: randomItem(["linux", "alpine"]),
    kernelVersion: randomItem(["5.15.0", "5.10.0", "6.1.0"]),
    bootOptions: {
      quiet: Math.random() > 0.5,
      splash: Math.random() > 0.7,
      timeout: randomItem([5, 10, 15])
    },
    networking: {
      enabled: true,
      dhcp: Math.random() > 0.3
    },
    graphics: {
      enabled: true,
      acceleration: Math.random() > 0.5,
      resolution: randomItem(["800x600", "1024x768", "1280x720", "1920x1080"])
    },
    persistenceEnabled: Math.random() > 0.2,
    autoStart: Math.random() > 0.6
  };
}

// Helper function to generate realistic VM resources
function generateVMResources(config: any): any {
  return {
    cpu: `${config.cpuCores} cores`,
    memory: `${config.memoryMB / 1024}GB`,
    disk: `${config.diskGB}GB`,
    network: "1 Gbps",
    gpu: Math.random() > 0.7 ? "Enabled" : "Disabled"
  };
}

// Helper function to generate realistic VM network configuration
function generateNetworkConfig(): any {
  const networkTypes = ["bridged", "nat", "host-only", "internal"];
  const type = randomItem(networkTypes);
  
  const baseConfig = {
    type,
    ipAddress: type === "bridged" ? "auto" : `192.168.${randomNumber(1, 254)}.${randomNumber(2, 254)}`,
    subnetMask: "255.255.255.0",
    gateway: `192.168.${randomNumber(1, 254)}.1`,
    dns: ["8.8.8.8", "1.1.1.1"]
  };
  
  // Add more configuration for bridged networks
  if (type === "bridged") {
    return {
      ...baseConfig,
      macAddress: `52:54:00:${randomNumber(10, 99)}:${randomNumber(10, 99)}:${randomNumber(10, 99)}`,
      promiscuous: Math.random() > 0.8,
      bandwidth: {
        inbound: `${randomNumber(10, 100)}Mbps`,
        outbound: `${randomNumber(10, 100)}Mbps`
      },
      vlan: Math.random() > 0.7 ? randomNumber(1, 4094) : null
    };
  }
  
  return baseConfig;
}

// Helper function to generate realistic metric data
function generateMetricData(metricType: MetricType, timestamp: Date): { value: number, unit: string } {
  let value: number;
  let unit: string;
  
  switch (metricType) {
    case MetricType.CPU_USAGE:
      value = Math.random() * 100;
      unit = "percent";
      break;
    case MetricType.MEMORY_USAGE:
      value = Math.random() * 8192;
      unit = "MB";
      break;
    case MetricType.DISK_USAGE:
      value = Math.random() * 50;
      unit = "GB";
      break;
    case MetricType.NETWORK_IN:
      value = Math.random() * 100;
      unit = "Mbps";
      break;
    case MetricType.NETWORK_OUT:
      value = Math.random() * 50;
      unit = "Mbps";
      break;
    case MetricType.RESPONSE_TIME:
      value = Math.random() * 500;
      unit = "ms";
      break;
    default:
      value = Math.random() * 100;
      unit = "units";
  }
  
  // Add some realistic patterns
  // Higher CPU/memory during business hours
  const hour = timestamp.getHours();
  if (hour >= 9 && hour <= 17) {
    if (metricType === MetricType.CPU_USAGE || metricType === MetricType.MEMORY_USAGE) {
      value = value * 1.5;
    }
  }
  
  // Higher network traffic during certain hours
  if (hour >= 12 && hour <= 14 || hour >= 16 && hour <= 18) {
    if (metricType === MetricType.NETWORK_IN || metricType === MetricType.NETWORK_OUT) {
      value = value * 1.8;
    }
  }
  
  return { value, unit };
}

// Helper function to generate OAuth accounts for users
async function createOAuthAccountsForUser(userId: string): Promise<void> {
  const providers = [
    { name: 'google', id: `google-${randomUUID().slice(0, 8)}` },
    { name: 'github', id: `github-${randomUUID().slice(0, 8)}` }
  ];
  
  // Randomly decide if user has OAuth accounts
  if (Math.random() > 0.5) {
    const selectedProvider = randomItem(providers);
    
    await prisma.account.create({
      data: {
        userId,
        type: 'oauth',
        provider: selectedProvider.name,
        providerAccountId: selectedProvider.id,
        access_token: `access-${randomUUID()}`,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        scope: 'read:user user:email',
        id_token: Math.random() > 0.5 ? `id-token-${randomUUID()}` : null,
        session_state: Math.random() > 0.7 ? `session-${randomUUID().slice(0, 6)}` : null,
      }
    });
    
    console.log(`Created ${selectedProvider.name} OAuth account for user ID: ${userId}`);
  }
}

// Helper function to create organization invitations
async function createOrganizationInvitations(organizationId: string, count: number): Promise<void> {
  const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'company.com', 'example.org'];
  const roles = [MemberRole.ADMIN, MemberRole.MEMBER];
  
  for (let i = 0; i < count; i++) {
    const email = `invite${i + 1}@${randomItem(domains)}`;
    const role = randomItem(roles);
    const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    
    await prisma.organizationInvitation.create({
      data: {
        email,
        organizationId,
        role,
        token: randomUUID(),
        expires: expiryDate
      }
    });
    
    console.log(`Created invitation for ${email} to join organization ID: ${organizationId}`);
  }
}

// Main seeding function
async function main() {
  console.log('Starting enhanced database seeding...');
  
  // Create admin user with more details
  const adminPassword = await hash('T3chn0l0gy@1', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'thando@soimagine.co.za' },
    update: {},
    create: {
      email: 'thando@soimagine.co.za',
      name: 'Thando Zungu',
      password: adminPassword,
      role: UserRole.SUPER_ADMIN,
      image: 'https://ui-avatars.com/api/?name=Thando+Zungu&background=0D8ABC&color=fff',
      preferences: {
        create: {
          theme: 'dark',
        },
      },
    },
  });
  console.log(`Created admin user: ${admin.email}`);
  
  // Create OAuth account for admin
  await createOAuthAccountsForUser(admin.id);

  // Create a variety of regular users with different roles
  const userRoles = [
    { email: 'developer@example.com', name: 'Alex Developer', role: UserRole.USER },
    { email: 'designer@example.com', name: 'Sam Designer', role: UserRole.USER },
    { email: 'manager@example.com', name: 'Jordan Manager', role: UserRole.USER },
    { email: 'admin@example.com', name: 'Taylor Admin', role: UserRole.ADMIN },
    { email: 'tester@example.com', name: 'Casey Tester', role: UserRole.USER },
    { email: 'product@example.com', name: 'Morgan Product', role: UserRole.USER },
    { email: 'marketing@example.com', name: 'Riley Marketing', role: UserRole.USER }
  ];
  
  const regularUsers = [];
  for (const userData of userRoles) {
    const password = await hash(`${userData.name.split(' ')[0]}Pass123!`, 10);
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        name: userData.name,
        password,
        role: userData.role,
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`,
        preferences: {
          create: {
            theme: randomItem(['light', 'dark', 'system']),
          },
        },
      },
    });
    regularUsers.push(user);
    console.log(`Created user: ${user.email} with role ${userData.role}`);
    
    // Create OAuth accounts for some users
    await createOAuthAccountsForUser(user.id);
  }

  // Create organizations with more realistic data
  const organizations = [];
  const orgNames = [
    'Acme Corporation', 
    'TechNova Solutions', 
    'Creative Minds Studio', 
    'Global Innovations', 
    'Quantum Enterprises'
  ];
  
  for (let i = 0; i < orgNames.length; i++) {
    const orgData = generateOrganizationData(orgNames[i]);
    const orgMetadata = {
      description: orgData.description,
      industry: orgData.industry,
      size: orgData.size,
      website: orgData.website,
      founded: 2010 + randomNumber(0, 13),
      location: randomItem(['New York', 'San Francisco', 'London', 'Tokyo', 'Berlin', 'Toronto', 'Sydney']),
      socialMedia: {
        twitter: `https://twitter.com/${orgNames[i].toLowerCase().replace(/\s+/g, '')}`,
        linkedin: `https://linkedin.com/company/${orgNames[i].toLowerCase().replace(/\s+/g, '')}`
      }
    };
    
    const org = await prisma.organization.upsert({
      where: { slug: orgNames[i].toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        name: orgNames[i],
        slug: orgNames[i].toLowerCase().replace(/\s+/g, '-'),
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(orgNames[i])}&background=random`,
      },
    });
    organizations.push(org);
    console.log(`Created organization: ${org.name}`);
    
    // Create invitations for each organization
    await createOrganizationInvitations(org.id, randomNumber(2, 5));

    // Add admin as owner to all organizations
    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId: admin.id,
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        userId: admin.id,
        role: MemberRole.OWNER,
      },
    });
    console.log(`Added admin as owner to: ${org.name}`);

    // Add regular users as members to organizations with more complex role distribution
    const availableUsers = [...regularUsers];
    const memberCount = Math.min(availableUsers.length, randomNumber(3, 6));
    
    for (let j = 0; j < memberCount; j++) {
      const userIndex = Math.floor(Math.random() * availableUsers.length);
      const user = availableUsers.splice(userIndex, 1)[0];
      
      // Assign roles based on user's name/position
      let role: MemberRole = MemberRole.MEMBER;
      if (user.name && (user.name.includes('Admin') || user.name.includes('Manager'))) {
        role = MemberRole.ADMIN;
      } else if (j === 0 && Math.random() > 0.7) {
        role = MemberRole.OWNER; // Sometimes make the first user an owner
      }
      
      await prisma.organizationMember.upsert({
        where: {
          organizationId_userId: {
            organizationId: org.id,
            userId: user.id,
          },
        },
        update: {},
        create: {
          organizationId: org.id,
          userId: user.id,
          role,
        },
      });
      console.log(`Added ${user.name} as ${role} to: ${org.name}`);
    }

    // Create projects for each organization with more realistic data
    const projectTypes = [
      'Web Development', 
      'Mobile App', 
      'Design System', 
      'Marketing Campaign', 
      'Infrastructure Upgrade',
      'Data Analytics',
      'E-commerce Platform',
      'Internal Tools'
    ];
    
    const projectCount = randomNumber(2, 4); // 2-4 projects per org
    for (let p = 0; p < projectCount; p++) {
      const projectType = randomItem(projectTypes);
      const projectName = `${orgNames[i]} ${projectType}`;
      const projectDescription = generateProjectDescription(projectName, orgNames[i]);
      
      const project = await prisma.project.create({
        data: {
          name: projectName,
          description: projectDescription,
          organizationId: org.id,
        },
      });
      console.log(`Created project: ${project.name}`);

      // Create tasks for each project with more realistic data
      const taskStatuses = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE];
      const taskPriorities = [TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH];
      
      // Create a more realistic distribution of task statuses
      const taskCount = randomNumber(5, 12); // 5-12 tasks per project
      for (let t = 0; t < taskCount; t++) {
        // Weight the distribution of statuses
        let status;
        const statusRoll = Math.random();
        if (statusRoll < 0.4) {
          status = TaskStatus.TODO;
        } else if (statusRoll < 0.7) {
          status = TaskStatus.IN_PROGRESS;
        } else {
          status = TaskStatus.DONE;
        }
        
        // Weight the distribution of priorities
        let priority;
        const priorityRoll = Math.random();
        if (priorityRoll < 0.25) {
          priority = TaskPriority.HIGH;
        } else if (priorityRoll < 0.65) {
          priority = TaskPriority.MEDIUM;
        } else {
          priority = TaskPriority.LOW;
        }
        
        // Generate realistic task title based on project type
        const title = generateTaskTitle(projectType);
        const description = generateTaskDescription(title, priority);
        
        // Assign tasks to users with appropriate roles in the organization
        const orgMembers = await prisma.organizationMember.findMany({
          where: { organizationId: org.id },
          include: { user: true }
        });
        
        // Filter potential assignees based on task type and user role
        let potentialAssignees = orgMembers.map(member => member.user);
        
        if (title.toLowerCase().includes('design')) {
          potentialAssignees = potentialAssignees.filter(user => 
            user.name?.toLowerCase().includes('design') || Math.random() > 0.7);
        } else if (title.toLowerCase().includes('implement') || title.toLowerCase().includes('develop')) {
          potentialAssignees = potentialAssignees.filter(user => 
            user.name?.toLowerCase().includes('develop') || Math.random() > 0.7);
        } else if (title.toLowerCase().includes('marketing')) {
          potentialAssignees = potentialAssignees.filter(user => 
            user.name?.toLowerCase().includes('marketing') || Math.random() > 0.7);
        }
        
        // Sometimes leave tasks unassigned
        const assigneeId = Math.random() > 0.2 && potentialAssignees.length > 0
          ? randomItem(potentialAssignees).id
          : null;
        
        // Create due dates with a realistic distribution
        let dueDate = null;
        if (status !== TaskStatus.DONE || Math.random() > 0.7) {
          const now = new Date();
          if (status === TaskStatus.TODO) {
            // Future due date for TODO tasks
            dueDate = randomDate(
              new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
              new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
            );
          } else if (status === TaskStatus.IN_PROGRESS) {
            // Closer due date for IN_PROGRESS tasks
            dueDate = randomDate(
              new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
              new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
            );
          } else {
            // Past due date for DONE tasks
            dueDate = randomDate(
              new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
              new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
            );
          }
        }
        
        // Create the task with all the generated data
        const task = await prisma.task.create({
          data: {
            title,
            description,
            status,
            priority,
            projectId: project.id,
            assigneeId,
            dueDate,
            // Add created/updated dates with realistic timing
            createdAt: status === TaskStatus.DONE 
              ? randomDate(
                  new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
                  new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
                )
              : randomDate(
                  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                  new Date() // today
                ),
          },
        });
        console.log(`Created task: ${task.title}`);
      }

      // Create workspaces for each project with more realistic configurations
      const workspaceCount = randomNumber(1, 3); // 1-3 workspaces per project
      for (let w = 0; w < workspaceCount; w++) {
        // Generate more descriptive workspace names
        let workspaceName;
        if (w === 0) {
          workspaceName = `${project.name} - Development`;
        } else if (w === 1) {
          workspaceName = `${project.name} - Staging`;
        } else {
          workspaceName = `${project.name} - Production`;
        }
        
        // Determine status based on workspace type and add some randomness
        let status;
        if (w === 0) {
          // Development workspace is usually active
          status = Math.random() > 0.2 ? WorkspaceStatus.ACTIVE : WorkspaceStatus.INACTIVE;
        } else if (w === 1) {
          // Staging workspace has mixed status
          status = Math.random() > 0.5 ? WorkspaceStatus.ACTIVE : WorkspaceStatus.INACTIVE;
        } else {
          // Production workspace is sometimes archived
          const statusRoll = Math.random();
          if (statusRoll < 0.6) {
            status = WorkspaceStatus.ACTIVE;
          } else if (statusRoll < 0.8) {
            status = WorkspaceStatus.INACTIVE;
          } else {
            status = WorkspaceStatus.ARCHIVED;
          }
        }
        
        // Generate realistic workspace description
        let description;
        if (workspaceName.includes('Development')) {
          description = `Development environment for ${project.name} where new features are implemented and tested.`;
        } else if (workspaceName.includes('Staging')) {
          description = `Staging environment for ${project.name} used for integration testing and client demos.`;
        } else if (workspaceName.includes('Production')) {
          description = `Production environment for ${project.name} serving live traffic and end users.`;
        } else {
          description = `Environment for ${project.name} project work.`;
        }
        
        // Generate realistic workspace configuration
        const isActive = status === WorkspaceStatus.ACTIVE;
        const config = generateWorkspaceConfig(project.name, isActive);
        
        const workspace = await prisma.workspace.create({
          data: {
            name: workspaceName,
            description,
            projectId: project.id,
            status,
            config,
            // Add created/updated dates with realistic timing
            createdAt: randomDate(
              new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
              new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
            ),
          },
        });
        console.log(`Created workspace: ${workspace.name} with status ${status}`);

        // Create WebVM instances for active and some inactive workspaces
        if (status === WorkspaceStatus.ACTIVE || (status === WorkspaceStatus.INACTIVE && Math.random() > 0.7)) {
          // Generate realistic VM configuration
          const vmConfig = generateVMConfig();
          const resources = generateVMResources(vmConfig);
          const networkConfig = generateNetworkConfig();
          
          // Determine VM status based on workspace status
          let vmStatus;
          if (status === WorkspaceStatus.ACTIVE) {
            vmStatus = Math.random() > 0.2 ? WebVMStatus.RUNNING : WebVMStatus.STARTING;
          } else {
            vmStatus = Math.random() > 0.5 ? WebVMStatus.STOPPED : WebVMStatus.SUSPENDED;
          }
          
          // Generate realistic VM name
          const vmName = `${workspace.name.split(' - ')[1] || 'Dev'}-VM-${randomNumber(1001, 9999)}`;
          
          // Create the VM instance
          const instance = await prisma.webVMInstance.create({
            data: {
              name: vmName,
              workspaceId: workspace.id,
              status: vmStatus,
              imageUrl: `https://storage.example.com/cheerpx-images/${randomItem(['alpine', 'ubuntu', 'debian'])}-${randomItem(['latest', '3.16', '22.04', '11'])}.wasm`,
              config: vmConfig,
              resources,
              networkConfig,
              connectionUrl: `https://webvm.vibecraft.com/${workspace.id}/${randomUUID().slice(0, 8)}`,
              startedAt: vmStatus === WebVMStatus.RUNNING ? randomDate(
                new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
                new Date() // now
              ) : null,
              stoppedAt: vmStatus === WebVMStatus.STOPPED ? randomDate(
                new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
                new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
              ) : null,
            },
          });
          console.log(`Created WebVM instance: ${instance.name} with status ${vmStatus}`);

          // Create metrics with realistic patterns for the instance
          if (vmStatus === WebVMStatus.RUNNING) {
            const metricTypes = Object.values(MetricType);
            
            // Create more data points for a richer history
            const dataPointCount = randomNumber(20, 50);
            for (let m = 0; m < metricTypes.length; m++) {
              const metricType = metricTypes[m];
              
              // Create data points with timestamps spanning the last few days
              for (let d = 0; d < dataPointCount; d++) {
                const timestamp = new Date(Date.now() - d * 3600 * 1000); // Every hour going back
                const { value, unit } = generateMetricData(metricType as MetricType, timestamp);
                
                await prisma.webVMMetric.create({
                  data: {
                    instanceId: instance.id,
                    metricType: metricType as MetricType,
                    value,
                    unit,
                    timestamp,
                  },
                });
              }
              console.log(`Created ${dataPointCount} metrics for ${metricType}`);
            }
          }
        }
      }
    }
  }

  console.log('Enhanced database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });