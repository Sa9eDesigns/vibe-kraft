/**
 * Seed Project Templates for Pyodide Workspaces
 * Pre-configured Python projects to help users get started quickly
 */

export interface SeedProject {
  id: string;
  name: string;
  description: string;
  category: 'data-science' | 'web-dev' | 'automation' | 'games' | 'education' | 'ai-ml';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  packages: string[];
  files: {
    path: string;
    content: string;
    description?: string;
  }[];
  readme: string;
  estimatedTime: string;
  learningObjectives: string[];
}

export const SEED_PROJECTS: SeedProject[] = [
  {
    id: 'hello-python',
    name: 'Hello Python',
    description: 'A simple introduction to Python basics and the Pyodide environment',
    category: 'education',
    difficulty: 'beginner',
    tags: ['basics', 'introduction', 'tutorial'],
    packages: [],
    estimatedTime: '15 minutes',
    learningObjectives: [
      'Understand Python syntax basics',
      'Learn how to use print statements',
      'Explore variables and data types',
      'Practice with simple functions'
    ],
    files: [
      {
        path: 'main.py',
        content: `#!/usr/bin/env python3
"""
Hello Python - Introduction to Python Basics
=============================================

Welcome to your first Python project in Pyodide!
This project covers the fundamentals of Python programming.
"""

def main():
    # Basic print statement
    print("Hello, Python World!")
    print("Welcome to Pyodide - Python in the browser!")
    
    # Variables and data types
    name = "Pythonista"
    age = 25
    height = 5.9
    is_learning = True
    
    print(f"\\nName: {name}")
    print(f"Age: {age}")
    print(f"Height: {height} feet")
    print(f"Currently learning: {is_learning}")
    
    # Lists and loops
    favorite_languages = ["Python", "JavaScript", "TypeScript", "Rust"]
    print("\\nFavorite programming languages:")
    for i, language in enumerate(favorite_languages, 1):
        print(f"{i}. {language}")
    
    # Dictionary example
    person = {
        "name": name,
        "age": age,
        "skills": favorite_languages
    }
    
    print(f"\\nPerson info: {person}")
    
    # Function example
    result = calculate_area(10, 5)
    print(f"\\nArea of rectangle (10x5): {result}")

def calculate_area(length, width):
    """Calculate the area of a rectangle."""
    return length * width

def greet_user(name="World"):
    """Greet a user with a personalized message."""
    return f"Hello, {name}! Welcome to Python programming!"

if __name__ == "__main__":
    main()
    
    # Try the greeting function
    print("\\n" + greet_user())
    print(greet_user("Alice"))
`,
        description: 'Main Python script demonstrating basic concepts'
      },
      {
        path: 'exercises.py',
        content: `"""
Practice Exercises
==================

Try these exercises to practice Python basics!
"""

# Exercise 1: Variables and Math
def exercise_1():
    """Practice with variables and basic math operations."""
    print("Exercise 1: Variables and Math")
    print("-" * 30)
    
    # TODO: Create variables for your favorite number and double it
    favorite_number = 42
    doubled = favorite_number * 2
    
    print(f"My favorite number: {favorite_number}")
    print(f"Doubled: {doubled}")
    
    # TODO: Calculate the area of a circle (π * r²)
    import math
    radius = 5
    area = math.pi * radius ** 2
    print(f"Area of circle with radius {radius}: {area:.2f}")

# Exercise 2: Lists and Strings
def exercise_2():
    """Practice with lists and string manipulation."""
    print("\\nExercise 2: Lists and Strings")
    print("-" * 30)
    
    # TODO: Create a list of your hobbies
    hobbies = ["coding", "reading", "gaming", "music"]
    
    print("My hobbies:")
    for hobby in hobbies:
        print(f"- {hobby.title()}")
    
    # TODO: Create a sentence from the list
    sentence = f"I enjoy {', '.join(hobbies[:-1])}, and {hobbies[-1]}."
    print(f"\\n{sentence}")

# Exercise 3: Functions
def exercise_3():
    """Practice creating and using functions."""
    print("\\nExercise 3: Functions")
    print("-" * 30)
    
    def celsius_to_fahrenheit(celsius):
        """Convert Celsius to Fahrenheit."""
        return (celsius * 9/5) + 32
    
    def fahrenheit_to_celsius(fahrenheit):
        """Convert Fahrenheit to Celsius."""
        return (fahrenheit - 32) * 5/9
    
    # Test the functions
    temp_c = 25
    temp_f = celsius_to_fahrenheit(temp_c)
    print(f"{temp_c}°C = {temp_f}°F")

    temp_f = 77
    temp_c = fahrenheit_to_celsius(temp_f)
    print(f"{temp_f}°F = {temp_c:.1f}°C")

# Run all exercises
if __name__ == "__main__":
    exercise_1()
    exercise_2()
    exercise_3()
    
    print("\\n🎉 Great job! You've completed the basic exercises!")
    print("Try modifying the code and running it again to experiment!")
`,
        description: 'Practice exercises for Python fundamentals'
      }
    ],
    readme: `# Hello Python Project

Welcome to your first Python project in Pyodide! This project is designed to introduce you to Python programming basics in a browser-based environment.

## What You'll Learn

- Python syntax and basic concepts
- Variables and data types
- Functions and control flow
- Lists, dictionaries, and loops
- String manipulation

## Files

- \`main.py\` - Main demonstration script
- \`exercises.py\` - Practice exercises

## Getting Started

1. Run \`main.py\` to see Python basics in action
2. Try the exercises in \`exercises.py\`
3. Experiment by modifying the code
4. Use the terminal to run: \`python main.py\`

## Next Steps

- Try creating your own functions
- Experiment with different data types
- Create your own variables and calculations
- Explore Python's built-in functions

Happy coding! 🐍
`
  },

  {
    id: 'data-analysis-starter',
    name: 'Data Analysis with Pandas',
    description: 'Learn data analysis fundamentals using Pandas and NumPy',
    category: 'data-science',
    difficulty: 'intermediate',
    tags: ['pandas', 'numpy', 'data-analysis', 'csv'],
    packages: ['pandas', 'numpy', 'matplotlib'],
    estimatedTime: '45 minutes',
    learningObjectives: [
      'Load and explore datasets with Pandas',
      'Perform basic data cleaning and manipulation',
      'Create visualizations with Matplotlib',
      'Calculate summary statistics'
    ],
    files: [
      {
        path: 'data_analysis.py',
        content: `#!/usr/bin/env python3
"""
Data Analysis with Pandas
=========================

This project demonstrates basic data analysis using Pandas and NumPy.
We'll work with sample sales data to learn key concepts.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime, timedelta
import random

def create_sample_data():
    """Create sample sales data for analysis."""
    print("Creating sample sales data...")
    
    # Set random seed for reproducible results
    np.random.seed(42)
    random.seed(42)
    
    # Generate sample data
    products = ['Laptop', 'Mouse', 'Keyboard', 'Monitor', 'Headphones']
    regions = ['North', 'South', 'East', 'West']
    
    data = []
    start_date = datetime(2023, 1, 1)
    
    for i in range(1000):
        date = start_date + timedelta(days=random.randint(0, 365))
        product = random.choice(products)
        region = random.choice(regions)
        quantity = random.randint(1, 10)
        
        # Price varies by product
        price_map = {
            'Laptop': random.uniform(800, 1500),
            'Monitor': random.uniform(200, 600),
            'Keyboard': random.uniform(50, 150),
            'Mouse': random.uniform(20, 80),
            'Headphones': random.uniform(30, 200)
        }
        
        price = round(price_map[product], 2)
        total = round(quantity * price, 2)
        
        data.append({
            'date': date.strftime('%Y-%m-%d'),
            'product': product,
            'region': region,
            'quantity': quantity,
            'price': price,
            'total': total
        })
    
    return pd.DataFrame(data)

def analyze_data(df):
    """Perform basic data analysis."""
    print("\\n📊 Data Analysis Results")
    print("=" * 40)
    
    # Basic info about the dataset
    print(f"Dataset shape: {df.shape}")
    print(f"Date range: {df['date'].min()} to {df['date'].max()}")
    
    # Summary statistics
    print("\\n📈 Summary Statistics:")
    print(df[['quantity', 'price', 'total']].describe())
    
    # Sales by product
    print("\\n🛍️ Sales by Product:")
    product_sales = df.groupby('product')['total'].sum().sort_values(ascending=False)
    for product, total in product_sales.items():
        print(f"{product}: $\{total:,.2f}")
    
    # Sales by region
    print("\\n🌍 Sales by Region:")
    region_sales = df.groupby('region')['total'].sum().sort_values(ascending=False)
    for region, total in region_sales.items():
        print(f"{region}: $\{total:,.2f}")
    
    # Monthly trends
    df['month'] = pd.to_datetime(df['date']).dt.to_period('M')
    monthly_sales = df.groupby('month')['total'].sum()
    print(f"\\n📅 Monthly Sales Trend:")
    print(f"Average monthly sales: $\{monthly_sales.mean():,.2f}")
    print(f"Best month: {monthly_sales.idxmax()} ($\{monthly_sales.max():,.2f})")
    print(f"Worst month: {monthly_sales.idxmin()} ($\{monthly_sales.min():,.2f})")
    
    return df

def create_visualizations(df):
    """Create basic visualizations."""
    print("\\n📊 Creating visualizations...")
    
    # Set up the plotting style
    plt.style.use('default')
    fig, axes = plt.subplots(2, 2, figsize=(12, 10))
    fig.suptitle('Sales Data Analysis', fontsize=16)
    
    # 1. Sales by Product (Bar Chart)
    product_sales = df.groupby('product')['total'].sum().sort_values(ascending=False)
    axes[0, 0].bar(product_sales.index, product_sales.values)
    axes[0, 0].set_title('Total Sales by Product')
    axes[0, 0].set_ylabel('Sales ($)')
    axes[0, 0].tick_params(axis='x', rotation=45)
    
    # 2. Sales by Region (Pie Chart)
    region_sales = df.groupby('region')['total'].sum()
    axes[0, 1].pie(region_sales.values, labels=region_sales.index, autopct='%1.1f%%')
    axes[0, 1].set_title('Sales Distribution by Region')
    
    # 3. Monthly Sales Trend (Line Chart)
    df['month'] = pd.to_datetime(df['date']).dt.to_period('M')
    monthly_sales = df.groupby('month')['total'].sum()
    axes[1, 0].plot(range(len(monthly_sales)), monthly_sales.values, marker='o')
    axes[1, 0].set_title('Monthly Sales Trend')
    axes[1, 0].set_ylabel('Sales ($)')
    axes[1, 0].set_xlabel('Month')
    
    # 4. Quantity vs Price Scatter Plot
    axes[1, 1].scatter(df['price'], df['quantity'], alpha=0.6)
    axes[1, 1].set_title('Price vs Quantity')
    axes[1, 1].set_xlabel('Price ($)')
    axes[1, 1].set_ylabel('Quantity')
    
    plt.tight_layout()
    plt.show()
    
    print("✅ Visualizations created successfully!")

def main():
    """Main analysis function."""
    print("🐼 Welcome to Data Analysis with Pandas!")
    print("=" * 50)
    
    # Create and load sample data
    df = create_sample_data()
    print(f"✅ Created dataset with {len(df)} records")
    
    # Display first few rows
    print("\\n👀 First 5 rows of data:")
    print(df.head())
    
    # Perform analysis
    df = analyze_data(df)
    
    # Create visualizations
    create_visualizations(df)
    
    print("\\n🎉 Analysis complete!")
    print("\\nTry modifying the code to:")
    print("- Add more products or regions")
    print("- Change the date range")
    print("- Create different types of charts")
    print("- Calculate additional statistics")

if __name__ == "__main__":
    main()
`,
        description: 'Main data analysis script with sample data generation'
      },
      {
        path: 'data_exercises.py',
        content: `"""
Data Analysis Exercises
======================

Practice exercises for data manipulation and analysis.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

def exercise_1_basic_operations():
    """Exercise 1: Basic DataFrame operations."""
    print("Exercise 1: Basic DataFrame Operations")
    print("-" * 40)
    
    # Create a simple dataset
    data = {
        'name': ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'],
        'age': [25, 30, 35, 28, 32],
        'city': ['New York', 'London', 'Tokyo', 'Paris', 'Sydney'],
        'salary': [50000, 60000, 75000, 55000, 68000]
    }
    
    df = pd.DataFrame(data)
    print("Original DataFrame:")
    print(df)
    
    # TODO: Try these operations
    print(f"\\nAverage age: {df['age'].mean():.1f}")
    print(f"Highest salary: $\{df['salary'].max():,}")
    print(f"People over 30: {len(df[df['age'] > 30])}")
    
    # Sorting
    print("\\nSorted by salary (descending):")
    print(df.sort_values('salary', ascending=False))

def exercise_2_data_cleaning():
    """Exercise 2: Data cleaning and handling missing values."""
    print("\\nExercise 2: Data Cleaning")
    print("-" * 40)
    
    # Create data with missing values
    data = {
        'product': ['A', 'B', 'C', 'D', 'E'],
        'price': [10.5, None, 15.0, 12.5, None],
        'quantity': [100, 150, None, 200, 175],
        'category': ['Electronics', 'Books', 'Electronics', None, 'Books']
    }
    
    df = pd.DataFrame(data)
    print("DataFrame with missing values:")
    print(df)
    print(f"\\nMissing values per column:")
    print(df.isnull().sum())
    
    # Fill missing values
    df_cleaned = df.copy()
    df_cleaned['price'].fillna(df_cleaned['price'].mean(), inplace=True)
    df_cleaned['quantity'].fillna(df_cleaned['quantity'].median(), inplace=True)
    df_cleaned['category'].fillna('Unknown', inplace=True)
    
    print("\\nCleaned DataFrame:")
    print(df_cleaned)

def exercise_3_grouping_aggregation():
    """Exercise 3: Grouping and aggregation."""
    print("\\nExercise 3: Grouping and Aggregation")
    print("-" * 40)
    
    # Create sales data
    np.random.seed(42)
    data = {
        'salesperson': np.random.choice(['Alice', 'Bob', 'Charlie'], 50),
        'product': np.random.choice(['Laptop', 'Phone', 'Tablet'], 50),
        'amount': np.random.uniform(100, 1000, 50).round(2),
        'quarter': np.random.choice(['Q1', 'Q2', 'Q3', 'Q4'], 50)
    }
    
    df = pd.DataFrame(data)
    
    print("Sample of sales data:")
    print(df.head())
    
    # Group by salesperson
    print("\\nSales by salesperson:")
    sales_by_person = df.groupby('salesperson')['amount'].agg(['sum', 'mean', 'count'])
    print(sales_by_person)
    
    # Group by product and quarter
    print("\\nSales by product and quarter:")
    sales_by_product_quarter = df.groupby(['product', 'quarter'])['amount'].sum().unstack()
    print(sales_by_product_quarter)

# Run all exercises
if __name__ == "__main__":
    exercise_1_basic_operations()
    exercise_2_data_cleaning()
    exercise_3_grouping_aggregation()
    
    print("\\n🎉 All exercises completed!")
    print("\\nNext steps:")
    print("- Try loading your own CSV data")
    print("- Experiment with different aggregation functions")
    print("- Create more complex visualizations")
`,
        description: 'Practice exercises for data analysis skills'
      }
    ],
    readme: `# Data Analysis with Pandas

Learn the fundamentals of data analysis using Pandas, NumPy, and Matplotlib in your browser!

## What You'll Learn

- Loading and exploring datasets
- Data cleaning and preprocessing
- Statistical analysis and aggregation
- Data visualization with Matplotlib
- Working with dates and time series

## Required Packages

This project uses the following Python packages:
- \`pandas\` - Data manipulation and analysis
- \`numpy\` - Numerical computing
- \`matplotlib\` - Data visualization

## Files

- \`data_analysis.py\` - Main analysis script with sample data
- \`data_exercises.py\` - Practice exercises

## Getting Started

1. Install required packages:
   \`\`\`python
   import micropip
   await micropip.install(['pandas', 'numpy', 'matplotlib'])
   \`\`\`

2. Run the main analysis:
   \`\`\`bash
   python data_analysis.py
   \`\`\`

3. Try the exercises:
   \`\`\`bash
   python data_exercises.py
   \`\`\`

## Sample Output

The analysis will show:
- Dataset overview and statistics
- Sales breakdown by product and region
- Monthly trends and patterns
- Interactive visualizations

## Next Steps

- Import your own CSV files
- Try different chart types
- Explore advanced Pandas features
- Learn about time series analysis

Happy analyzing! 📊
`
  },

  {
    id: 'web-scraping-basics',
    name: 'Web Scraping with Requests',
    description: 'Learn web scraping fundamentals using requests and basic HTML parsing',
    category: 'web-dev',
    difficulty: 'intermediate',
    tags: ['web-scraping', 'requests', 'html', 'api'],
    packages: ['requests', 'beautifulsoup4'],
    estimatedTime: '30 minutes',
    learningObjectives: [
      'Make HTTP requests with the requests library',
      'Parse HTML content',
      'Handle different response formats',
      'Work with APIs and JSON data'
    ],
    files: [
      {
        path: 'web_scraper.py',
        content: `#!/usr/bin/env python3
"""
Web Scraping Basics
===================

Learn web scraping fundamentals using requests library.
Note: Some features may be limited in the browser environment.
"""

import requests
import json
from datetime import datetime

def fetch_json_data():
    """Fetch and parse JSON data from a public API."""
    print("🌐 Fetching JSON data from public API...")
    
    try:
        # JSONPlaceholder - fake REST API for testing
        url = "https://jsonplaceholder.typicode.com/posts"
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for bad status codes
        
        posts = response.json()
        print(f"✅ Successfully fetched {len(posts)} posts")
        
        # Display first 3 posts
        print("\\n📝 Sample posts:")
        for post in posts[:3]:
            print(f"Post {post['id']}: {post['title'][:50]}...")
        
        return posts
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching data: {e}")
        return []

def analyze_posts(posts):
    """Analyze the fetched posts data."""
    if not posts:
        return
    
    print("\\n📊 Post Analysis:")
    print("-" * 30)
    
    # Count posts by user
    user_counts = {}
    for post in posts:
        user_id = post['userId']
        user_counts[user_id] = user_counts.get(user_id, 0) + 1
    
    print("Posts per user:")
    for user_id, count in sorted(user_counts.items()):
        print(f"User {user_id}: {count} posts")
    
    # Average title length
    title_lengths = [len(post['title']) for post in posts]
    avg_length = sum(title_lengths) / len(title_lengths)
    print(f"\\nAverage title length: {avg_length:.1f} characters")
    
    # Longest and shortest titles
    longest_post = max(posts, key=lambda p: len(p['title']))
    shortest_post = min(posts, key=lambda p: len(p['title']))
    
    print(f"\\nLongest title ({len(longest_post['title'])} chars):")
    print(f"  {longest_post['title']}")
    print(f"\\nShortest title ({len(shortest_post['title'])} chars):")
    print(f"  {shortest_post['title']}")

def fetch_user_data():
    """Fetch user information from the API."""
    print("\\n👥 Fetching user data...")
    
    try:
        url = "https://jsonplaceholder.typicode.com/users"
        response = requests.get(url)
        response.raise_for_status()
        
        users = response.json()
        print(f"✅ Successfully fetched {len(users)} users")
        
        # Display user information
        print("\\n👤 User Information:")
        for user in users[:3]:  # Show first 3 users
            print(f"User {user['id']}: {user['name']} ({user['email']})")
            print(f"  Company: {user['company']['name']}")
            print(f"  City: {user['address']['city']}")
            print()
        
        return users
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching users: {e}")
        return []

def create_user_post_report(users, posts):
    """Create a combined report of users and their posts."""
    if not users or not posts:
        return
    
    print("\\n📋 User-Post Report:")
    print("=" * 40)
    
    # Create user lookup
    user_lookup = {user['id']: user for user in users}
    
    # Group posts by user
    user_posts = {}
    for post in posts:
        user_id = post['userId']
        if user_id not in user_posts:
            user_posts[user_id] = []
        user_posts[user_id].append(post)
    
    # Generate report
    for user_id, user_post_list in user_posts.items():
        if user_id in user_lookup:
            user = user_lookup[user_id]
            print(f"\\n👤 {user['name']} ({user['email']})")
            print(f"   Company: {user['company']['name']}")
            print(f"   Posts: {len(user_post_list)}")
            
            # Show most recent post (assuming higher ID = more recent)
            latest_post = max(user_post_list, key=lambda p: p['id'])
            print(f"   Latest: {latest_post['title'][:40]}...")

def demonstrate_request_methods():
    """Demonstrate different HTTP methods."""
    print("\\n🔧 HTTP Methods Demonstration:")
    print("-" * 35)
    
    base_url = "https://jsonplaceholder.typicode.com"
    
    # GET request
    print("1. GET request:")
    response = requests.get(f"{base_url}/posts/1")
    if response.status_code == 200:
        post = response.json()
        print(f"   ✅ Retrieved post: {post['title'][:30]}...")
    
    # POST request (simulated)
    print("\\n2. POST request:")
    new_post = {
        'title': 'My New Post',
        'body': 'This is a test post created via API',
        'userId': 1
    }
    response = requests.post(f"{base_url}/posts", json=new_post)
    if response.status_code == 201:
        created_post = response.json()
        print(f"   ✅ Created post with ID: {created_post['id']}")
    
    # PUT request (simulated)
    print("\\n3. PUT request:")
    updated_post = {
        'id': 1,
        'title': 'Updated Post Title',
        'body': 'This post has been updated',
        'userId': 1
    }
    response = requests.put(f"{base_url}/posts/1", json=updated_post)
    if response.status_code == 200:
        print("   ✅ Post updated successfully")
    
    # DELETE request (simulated)
    print("\\n4. DELETE request:")
    response = requests.delete(f"{base_url}/posts/1")
    if response.status_code == 200:
        print("   ✅ Post deleted successfully")

def main():
    """Main function to run all demonstrations."""
    print("🕷️ Web Scraping Basics with Python")
    print("=" * 50)
    print("Note: This demo uses JSONPlaceholder, a fake REST API")
    print("for testing and prototyping.")
    
    # Fetch and analyze posts
    posts = fetch_json_data()
    if posts:
        analyze_posts(posts)
    
    # Fetch user data
    users = fetch_user_data()
    
    # Create combined report
    create_user_post_report(users, posts)
    
    # Demonstrate HTTP methods
    demonstrate_request_methods()
    
    print("\\n🎉 Web scraping demonstration complete!")
    print("\\nNext steps:")
    print("- Try different public APIs")
    print("- Learn about authentication (API keys)")
    print("- Explore rate limiting and respectful scraping")
    print("- Practice with different data formats (XML, CSV)")

if __name__ == "__main__":
    main()
`,
        description: 'Main web scraping demonstration script'
      }
    ],
    readme: `# Web Scraping Basics

Learn web scraping fundamentals using Python's requests library and work with APIs and JSON data.

## What You'll Learn

- Making HTTP requests (GET, POST, PUT, DELETE)
- Working with JSON APIs
- Error handling for web requests
- Data analysis from web sources
- Best practices for web scraping

## Required Packages

- \`requests\` - HTTP library for Python

## Files

- \`web_scraper.py\` - Main scraping demonstration

## Getting Started

1. Install the requests package:
   \`\`\`python
   import micropip
   await micropip.install('requests')
   \`\`\`

2. Run the scraper:
   \`\`\`bash
   python web_scraper.py
   \`\`\`

## Features

- Fetch data from JSONPlaceholder API
- Analyze posts and user data
- Demonstrate different HTTP methods
- Error handling and status codes

## Important Notes

- This example uses JSONPlaceholder (fake API for testing)
- Always respect robots.txt and rate limits
- Some websites may block requests from browsers
- Consider using proper headers and user agents

## Next Steps

- Try other public APIs
- Learn about authentication
- Explore HTML parsing with BeautifulSoup
- Practice with different data formats

Happy scraping! 🕷️
`
  },

  {
    id: 'simple-calculator',
    name: 'Interactive Calculator',
    description: 'Build a command-line calculator with advanced mathematical operations',
    category: 'education',
    difficulty: 'beginner',
    tags: ['math', 'calculator', 'functions', 'user-input'],
    packages: ['math'],
    estimatedTime: '25 minutes',
    learningObjectives: [
      'Create interactive command-line programs',
      'Handle user input and validation',
      'Use Python math library',
      'Implement error handling'
    ],
    files: [
      {
        path: 'calculator.py',
        content: `#!/usr/bin/env python3
"""
Interactive Calculator
=====================

A command-line calculator with basic and advanced mathematical operations.
"""

import math

class Calculator:
    """A simple calculator class with various mathematical operations."""

    def __init__(self):
        self.history = []

    def add(self, a, b):
        """Add two numbers."""
        result = a + b
        self.history.append(f"{a} + {b} = {result}")
        return result

    def subtract(self, a, b):
        """Subtract two numbers."""
        result = a - b
        self.history.append(f"{a} - {b} = {result}")
        return result

    def multiply(self, a, b):
        """Multiply two numbers."""
        result = a * b
        self.history.append(f"{a} × {b} = {result}")
        return result

    def divide(self, a, b):
        """Divide two numbers."""
        if b == 0:
            raise ValueError("Cannot divide by zero!")
        result = a / b
        self.history.append(f"{a} ÷ {b} = {result}")
        return result

    def power(self, a, b):
        """Raise a to the power of b."""
        result = a ** b
        self.history.append(f"{a}^{b} = {result}")
        return result

    def square_root(self, a):
        """Calculate square root."""
        if a < 0:
            raise ValueError("Cannot calculate square root of negative number!")
        result = math.sqrt(a)
        self.history.append(f"√{a} = {result}")
        return result

    def factorial(self, n):
        """Calculate factorial."""
        if n < 0:
            raise ValueError("Factorial is not defined for negative numbers!")
        if n != int(n):
            raise ValueError("Factorial is only defined for integers!")
        result = math.factorial(int(n))
        self.history.append(f"{int(n)}! = {result}")
        return result

    def sin(self, x):
        """Calculate sine (in radians)."""
        result = math.sin(x)
        self.history.append(f"sin({x}) = {result}")
        return result

    def cos(self, x):
        """Calculate cosine (in radians)."""
        result = math.cos(x)
        self.history.append(f"cos({x}) = {result}")
        return result

    def log(self, x, base=math.e):
        """Calculate logarithm."""
        if x <= 0:
            raise ValueError("Logarithm is not defined for non-positive numbers!")
        result = math.log(x, base)
        if base == math.e:
            self.history.append(f"ln({x}) = {result}")
        else:
            self.history.append(f"log_{base}({x}) = {result}")
        return result

    def show_history(self):
        """Display calculation history."""
        if not self.history:
            print("No calculations yet!")
            return

        print("\\n📜 Calculation History:")
        print("-" * 25)
        for i, calc in enumerate(self.history[-10:], 1):  # Show last 10
            print(f"{i:2d}. {calc}")

    def clear_history(self):
        """Clear calculation history."""
        self.history.clear()
        print("History cleared!")

def get_number(prompt):
    """Get a number from user input with validation."""
    while True:
        try:
            return float(input(prompt))
        except ValueError:
            print("❌ Please enter a valid number!")

def show_menu():
    """Display the calculator menu."""
    print("\\n🧮 Calculator Menu:")
    print("-" * 20)
    print("1.  Addition (+)")
    print("2.  Subtraction (-)")
    print("3.  Multiplication (×)")
    print("4.  Division (÷)")
    print("5.  Power (^)")
    print("6.  Square Root (√)")
    print("7.  Factorial (!)")
    print("8.  Sine (sin)")
    print("9.  Cosine (cos)")
    print("10. Natural Logarithm (ln)")
    print("11. Logarithm (log)")
    print("12. Show History")
    print("13. Clear History")
    print("0.  Exit")

def main():
    """Main calculator program."""
    print("🧮 Welcome to the Interactive Calculator!")
    print("=" * 45)

    calc = Calculator()

    while True:
        show_menu()

        try:
            choice = input("\\nEnter your choice (0-13): ").strip()

            if choice == '0':
                print("\\n👋 Thanks for using the calculator!")
                break

            elif choice == '1':  # Addition
                a = get_number("Enter first number: ")
                b = get_number("Enter second number: ")
                result = calc.add(a, b)
                print(f"\\n✅ Result: {a} + {b} = {result}")

            elif choice == '2':  # Subtraction
                a = get_number("Enter first number: ")
                b = get_number("Enter second number: ")
                result = calc.subtract(a, b)
                print(f"\\n✅ Result: {a} - {b} = {result}")

            elif choice == '3':  # Multiplication
                a = get_number("Enter first number: ")
                b = get_number("Enter second number: ")
                result = calc.multiply(a, b)
                print(f"\\n✅ Result: {a} × {b} = {result}")

            elif choice == '4':  # Division
                a = get_number("Enter dividend: ")
                b = get_number("Enter divisor: ")
                result = calc.divide(a, b)
                print(f"\\n✅ Result: {a} ÷ {b} = {result}")

            elif choice == '5':  # Power
                a = get_number("Enter base: ")
                b = get_number("Enter exponent: ")
                result = calc.power(a, b)
                print(f"\\n✅ Result: {a}^{b} = {result}")

            elif choice == '6':  # Square Root
                a = get_number("Enter number: ")
                result = calc.square_root(a)
                print(f"\\n✅ Result: √{a} = {result}")

            elif choice == '7':  # Factorial
                a = get_number("Enter number: ")
                result = calc.factorial(a)
                print(f"\\n✅ Result: {int(a)}! = {result}")

            elif choice == '8':  # Sine
                a = get_number("Enter angle in radians: ")
                result = calc.sin(a)
                print(f"\\n✅ Result: sin({a}) = {result}")

            elif choice == '9':  # Cosine
                a = get_number("Enter angle in radians: ")
                result = calc.cos(a)
                print(f"\\n✅ Result: cos({a}) = {result}")

            elif choice == '10':  # Natural Logarithm
                a = get_number("Enter number: ")
                result = calc.log(a)
                print(f"\\n✅ Result: ln({a}) = {result}")

            elif choice == '11':  # Logarithm with base
                a = get_number("Enter number: ")
                base = get_number("Enter base: ")
                result = calc.log(a, base)
                print(f"\\n✅ Result: log_{base}({a}) = {result}")

            elif choice == '12':  # Show History
                calc.show_history()

            elif choice == '13':  # Clear History
                calc.clear_history()

            else:
                print("❌ Invalid choice! Please select 0-13.")

        except ValueError as e:
            print(f"❌ Error: {e}")
        except Exception as e:
            print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    main()
`,
        description: 'Interactive calculator with advanced mathematical operations'
      }
    ],
    readme: `# Interactive Calculator

A feature-rich command-line calculator that demonstrates Python programming fundamentals including classes, error handling, and user interaction.

## Features

- Basic arithmetic operations (+, -, ×, ÷)
- Advanced mathematical functions (power, square root, factorial)
- Trigonometric functions (sin, cos)
- Logarithmic functions (natural log, custom base)
- Calculation history tracking
- Input validation and error handling

## What You'll Learn

- Object-oriented programming with classes
- User input handling and validation
- Error handling with try/except blocks
- Using Python's math library
- Creating interactive command-line programs

## Getting Started

Run the calculator:
\`\`\`bash
python calculator.py
\`\`\`

Follow the menu prompts to perform calculations!

## Example Usage

\`\`\`
🧮 Calculator Menu:
1. Addition (+)
2. Subtraction (-)
...

Enter your choice: 1
Enter first number: 15
Enter second number: 25
✅ Result: 15.0 + 25.0 = 40.0
\`\`\`

## Next Steps

- Add more mathematical functions
- Implement expression parsing (e.g., "2 + 3 * 4")
- Create a graphical user interface
- Add memory functions (store/recall)

Happy calculating! 🧮
`
  },

  {
    id: 'text-adventure-game',
    name: 'Text Adventure Game',
    description: 'Create an interactive text-based adventure game with rooms, items, and puzzles',
    category: 'games',
    difficulty: 'intermediate',
    tags: ['game', 'adventure', 'interactive', 'storytelling'],
    packages: ['random'],
    estimatedTime: '40 minutes',
    learningObjectives: [
      'Design game mechanics and state management',
      'Create interactive storytelling systems',
      'Implement inventory and item systems',
      'Use object-oriented programming for game entities'
    ],
    files: [
      {
        path: 'adventure_game.py',
        content: `#!/usr/bin/env python3
"""
Text Adventure Game
==================

An interactive text-based adventure game where players explore rooms,
collect items, and solve puzzles to escape the mysterious castle.
"""

import random

class Item:
    """Represents an item in the game."""

    def __init__(self, name, description, usable=False):
        self.name = name
        self.description = description
        self.usable = usable

    def __str__(self):
        return self.name

class Room:
    """Represents a room in the game."""

    def __init__(self, name, description):
        self.name = name
        self.description = description
        self.exits = {}
        self.items = []
        self.visited = False

    def add_exit(self, direction, room):
        """Add an exit to another room."""
        self.exits[direction] = room

    def add_item(self, item):
        """Add an item to the room."""
        self.items.append(item)

    def remove_item(self, item_name):
        """Remove an item from the room."""
        for item in self.items:
            if item.name.lower() == item_name.lower():
                self.items.remove(item)
                return item
        return None

    def get_full_description(self):
        """Get the full description including items and exits."""
        desc = self.description

        if self.items:
            desc += "\\n\\nYou see: " + ", ".join([item.name for item in self.items])

        exits = list(self.exits.keys())
        if exits:
            desc += "\\n\\nExits: " + ", ".join(exits)

        return desc

class Player:
    """Represents the player character."""

    def __init__(self, name):
        self.name = name
        self.inventory = []
        self.current_room = None
        self.health = 100
        self.score = 0

    def add_item(self, item):
        """Add an item to inventory."""
        self.inventory.append(item)
        self.score += 10

    def remove_item(self, item_name):
        """Remove an item from inventory."""
        for item in self.inventory:
            if item.name.lower() == item_name.lower():
                self.inventory.remove(item)
                return item
        return None

    def has_item(self, item_name):
        """Check if player has an item."""
        return any(item.name.lower() == item_name.lower() for item in self.inventory)

    def show_inventory(self):
        """Display player's inventory."""
        if not self.inventory:
            return "Your inventory is empty."
        return "Inventory: " + ", ".join([item.name for item in self.inventory])

class Game:
    """Main game class."""

    def __init__(self):
        self.player = None
        self.rooms = {}
        self.game_over = False
        self.setup_game()

    def setup_game(self):
        """Initialize the game world."""
        # Create items
        key = Item("rusty key", "An old, rusty key that might open something.", True)
        torch = Item("torch", "A flickering torch that provides light.", True)
        sword = Item("sword", "A sharp sword for protection.", True)
        potion = Item("health potion", "A red potion that restores health.", True)
        treasure = Item("golden treasure", "A chest full of golden coins!")

        # Create rooms
        entrance = Room("Castle Entrance",
                       "You stand before a massive stone castle. The heavy wooden door creaks ominously in the wind.")

        hall = Room("Great Hall",
                   "A vast hall with high ceilings and dusty tapestries. Moonlight streams through broken windows.")

        kitchen = Room("Kitchen",
                      "An old kitchen with rusty pots and pans. There's a strange smell in the air.")

        dungeon = Room("Dungeon",
                      "A dark, damp dungeon with stone walls. You hear water dripping somewhere.")

        tower = Room("Tower Room",
                    "The highest room in the castle. Through the window, you can see the entire countryside.")

        treasure_room = Room("Treasure Room",
                           "A hidden room filled with glittering treasures and ancient artifacts!")

        # Set up room connections
        entrance.add_exit("north", hall)
        hall.add_exit("south", entrance)
        hall.add_exit("east", kitchen)
        hall.add_exit("west", dungeon)
        hall.add_exit("up", tower)
        kitchen.add_exit("west", hall)
        dungeon.add_exit("east", hall)
        dungeon.add_exit("north", treasure_room)  # Hidden exit, needs key
        tower.add_exit("down", hall)

        # Add items to rooms
        entrance.add_item(torch)
        kitchen.add_item(key)
        kitchen.add_item(potion)
        tower.add_item(sword)
        treasure_room.add_item(treasure)

        # Store rooms
        self.rooms = {
            "entrance": entrance,
            "hall": hall,
            "kitchen": kitchen,
            "dungeon": dungeon,
            "tower": tower,
            "treasure_room": treasure_room
        }

    def start_game(self):
        """Start the game."""
        print("🏰 Welcome to the Castle Adventure!")
        print("=" * 40)
        print("You are a brave adventurer who has discovered a mysterious castle.")
        print("Your goal is to explore the castle, collect treasures, and escape safely!")
        print("\\nType 'help' for a list of commands.")

        name = input("\\nWhat is your name, brave adventurer? ").strip()
        if not name:
            name = "Adventurer"

        self.player = Player(name)
        self.player.current_room = self.rooms["entrance"]

        print(f"\\nWelcome, {self.player.name}! Your adventure begins...")
        self.game_loop()

    def game_loop(self):
        """Main game loop."""
        while not self.game_over:
            self.show_room()
            command = input("\\n> ").strip().lower()
            self.process_command(command)

    def show_room(self):
        """Display current room information."""
        room = self.player.current_room
        print("\\n" + "=" * 50)
        print(f"📍 {room.name}")
        print("-" * len(room.name))
        print(room.get_full_description())

        if not room.visited:
            room.visited = True
            self.player.score += 5

    def process_command(self, command):
        """Process player commands."""
        parts = command.split()
        if not parts:
            return

        action = parts[0]

        if action == "help":
            self.show_help()
        elif action in ["go", "move", "walk"]:
            if len(parts) > 1:
                self.move_player(parts[1])
            else:
                print("Go where? (north, south, east, west, up, down)")
        elif action in ["north", "south", "east", "west", "up", "down"]:
            self.move_player(action)
        elif action in ["take", "get", "pick"]:
            if len(parts) > 1:
                self.take_item(" ".join(parts[1:]))
            else:
                print("Take what?")
        elif action in ["use"]:
            if len(parts) > 1:
                self.use_item(" ".join(parts[1:]))
            else:
                print("Use what?")
        elif action in ["inventory", "inv", "i"]:
            print(self.player.show_inventory())
        elif action in ["look", "examine"]:
            if len(parts) > 1:
                self.examine(" ".join(parts[1:]))
            else:
                self.show_room()
        elif action in ["score"]:
            print(f"Score: {self.player.score} | Health: {self.player.health}")
        elif action in ["quit", "exit", "q"]:
            print("Thanks for playing! Goodbye!")
            self.game_over = True
        else:
            print("I don't understand that command. Type 'help' for available commands.")

    def show_help(self):
        """Display help information."""
        print("\\n📖 Available Commands:")
        print("-" * 20)
        print("Movement: north, south, east, west, up, down")
        print("Actions: take <item>, use <item>, look, examine <item>")
        print("Info: inventory, score, help")
        print("Other: quit")

    def move_player(self, direction):
        """Move player to a different room."""
        current_room = self.player.current_room

        if direction in current_room.exits:
            # Special case for treasure room - needs key
            if (current_room.exits[direction].name == "Treasure Room" and
                not self.player.has_item("rusty key")):
                print("The passage is blocked by a locked door. You need a key!")
                return

            self.player.current_room = current_room.exits[direction]
            print(f"You move {direction}.")

            # Check win condition
            if self.player.current_room.name == "Treasure Room":
                self.check_win_condition()
        else:
            print("You can't go that way!")

    def take_item(self, item_name):
        """Take an item from the current room."""
        room = self.player.current_room
        item = room.remove_item(item_name)

        if item:
            self.player.add_item(item)
            print(f"You take the {item.name}.")
        else:
            print("There's no such item here.")

    def use_item(self, item_name):
        """Use an item from inventory."""
        if not self.player.has_item(item_name):
            print("You don't have that item.")
            return

        if item_name.lower() == "health potion":
            self.player.health = min(100, self.player.health + 50)
            self.player.remove_item(item_name)
            print("You drink the potion and feel much better! Health restored.")
        elif item_name.lower() == "torch":
            print("The torch flickers, casting dancing shadows on the walls.")
        elif item_name.lower() == "sword":
            print("You brandish the sword. You feel more confident!")
        else:
            print("You can't use that item right now.")

    def examine(self, target):
        """Examine an item or room feature."""
        # Check inventory first
        for item in self.player.inventory:
            if item.name.lower() == target.lower():
                print(item.description)
                return

        # Check room items
        for item in self.player.current_room.items:
            if item.name.lower() == target.lower():
                print(item.description)
                return

        print("You don't see anything special about that.")

    def check_win_condition(self):
        """Check if player has won the game."""
        if self.player.current_room.name == "Treasure Room":
            print("\\n🎉 Congratulations!")
            print("You have discovered the legendary treasure room!")
            print("You carefully collect the golden treasure and make your escape.")
            print(f"\\nFinal Score: {self.player.score + 100}")
            print("You are now rich beyond your wildest dreams!")
            print("\\nThanks for playing the Castle Adventure!")
            self.game_over = True

def main():
    """Main function to start the game."""
    game = Game()
    game.start_game()

if __name__ == "__main__":
    main()
`,
        description: 'Main adventure game with rooms, items, and puzzles'
      }
    ],
    readme: `# Text Adventure Game

An interactive text-based adventure game where you explore a mysterious castle, collect items, and solve puzzles to find the legendary treasure!

## Game Features

- **Exploration**: Navigate through different rooms in the castle
- **Inventory System**: Collect and use items to solve puzzles
- **Puzzle Solving**: Find keys to unlock secret areas
- **Scoring System**: Earn points for exploration and item collection
- **Interactive Storytelling**: Rich descriptions and atmospheric text

## How to Play

1. Run the game:
   \`\`\`bash
   python adventure_game.py
   \`\`\`

2. Use commands to interact with the game:
   - **Movement**: \`north\`, \`south\`, \`east\`, \`west\`, \`up\`, \`down\`
   - **Actions**: \`take <item>\`, \`use <item>\`, \`look\`, \`examine <item>\`
   - **Info**: \`inventory\`, \`score\`, \`help\`

## Game World

- **Castle Entrance**: Your starting point
- **Great Hall**: The main hall with multiple exits
- **Kitchen**: Contains useful items
- **Dungeon**: A dark area with secrets
- **Tower Room**: The highest point of the castle
- **Treasure Room**: The ultimate goal (requires a key!)

## Tips

- Explore every room thoroughly
- Examine items before taking them
- Some areas require specific items to access
- Keep track of your inventory
- Look for clues in room descriptions

## What You'll Learn

- Object-oriented programming with classes
- Game state management
- User input processing
- Dictionary and list manipulation
- Conditional logic and game flow

## Next Steps

- Add more rooms and items
- Create combat system
- Implement save/load functionality
- Add random events
- Create multiple endings

Good luck, brave adventurer! 🏰
`
  }
];

export function getSeedProjectById(id: string): SeedProject | undefined {
  return SEED_PROJECTS.find(project => project.id === id);
}

export function getSeedProjectsByCategory(category: SeedProject['category']): SeedProject[] {
  return SEED_PROJECTS.filter(project => project.category === category);
}

export function getSeedProjectsByDifficulty(difficulty: SeedProject['difficulty']): SeedProject[] {
  return SEED_PROJECTS.filter(project => project.difficulty === difficulty);
}

export function searchSeedProjects(query: string): SeedProject[] {
  const lowercaseQuery = query.toLowerCase();
  return SEED_PROJECTS.filter(project =>
    project.name.toLowerCase().includes(lowercaseQuery) ||
    project.description.toLowerCase().includes(lowercaseQuery) ||
    project.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
}
