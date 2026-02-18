import setuptools

setuptools.setup(
    name="duelink",
    version="1.2.4",
    author="GHI Electronics",
    author_email="support@ghielectronics.com",
    license="MIT",
    description="GHI Electronics DUELink Python library.",
    long_description=open("README.md", encoding="utf-8").read(),
    long_description_content_type="text/markdown",
    url="https://www.duelink.com/",
    packages=setuptools.find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "Operating System :: OS Independent",
    ],
    install_requires=[
        "pyserial"
    ],
    python_requires=">=3.6",
)
