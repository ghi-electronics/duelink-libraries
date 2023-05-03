import setuptools

setuptools.setup(
    name = "DUE",
    version = "1.0.0.0",
    author = "GHI Electronics",
    author_email = "support@ghielectronics.com",
    description = "GHI Electronics DUE Python library.",
    url = "https://www.duelink.com/",
    packages=setuptools.find_packages(),
    classifiers=[
        "Development Status :: Python 3",        
    ],
    install_requires=[
   'pyserial'   
    ],    
    python_requires='>=3.6'
)