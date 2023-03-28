import setuptools

setuptools.setup(
    name = "Due",
    version = "0.0.0.5000",
    author = "GHI Electronics",
    author_email = "support@ghielectronics.com",
    description = "GHI Electronics Due Python library.",
    license = "MIT",
    url = "https://www.duelink.com/",
    packages=setuptools.find_packages(),
    classifiers=[
        "Development Status :: Python 3",        
    ],
    python_requires='>=3.6'
)