import setuptools

setuptools.setup(
    name = "DUELink",
    version = "1.2.1",
    author = "GHI Electronics",
    author_email = "support@ghielectronics.com",
    license='MIT', 
    description = "GHI Electronics DUELink Python library.",
    url = "https://www.duelink.com/",
    packages=setuptools.find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",        
    ],
    install_requires=[
   'pyserial'   
    ],    
    python_requires='>=3.6'
)